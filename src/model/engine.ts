import { evaluateFormula, parseFormula, safeEvaluateFormula, validateFormula } from './formulas';
import { ModelDefinition, ModelState, SimulationResult } from './types';

export type ComputedVariable = {
  id: string;
  name: string;
  formula: string;
  description: string;
  unit: string;
  role: string;
};

export const computedVariables: ComputedVariable[] = [
  {
    id: 'laborA',
    name: 'Labor in sector A',
    formula: 'laborSupply * sectorShareA',
    description: 'Labor allocated to sector A each step.',
    unit: 'labor units',
    role: 'Drives sector A output.',
  },
  {
    id: 'laborB',
    name: 'Labor in sector B',
    formula: 'laborSupply * (1 - sectorShareA)',
    description: 'Labor allocated to sector B each step.',
    unit: 'labor units',
    role: 'Drives sector B output.',
  },
  {
    id: 'innovationRate',
    name: 'Innovation rate',
    formula:
      'innovationBase * (1 + ipProtection * 0.6 + publicFunding * 0.4) * (1 - openSourceAdoption * 0.2)',
    description: 'Rate at which frontier productivity grows.',
    unit: 'per step',
    role: 'Drives productivity improvements.',
  },
  {
    id: 'diffusionRate',
    name: 'Diffusion rate',
    formula:
      'diffusionBase * (1 + openSourceAdoption * 0.9 + platformOpenness * 0.4 - ipProtection * 0.3)',
    description: 'Rate of knowledge diffusion between sectors.',
    unit: 'per step',
    role: 'Reduces productivity gaps.',
  },
  {
    id: 'marketPower',
    name: 'Market power index',
    formula: '1 + royaltyRate * 0.6 - antitrustStrength * 0.4 + ipProtection * 0.2',
    description: 'Index of markups and concentration.',
    unit: 'index',
    role: 'Shifts prices and distribution.',
  },
  {
    id: 'priceA',
    name: 'Price: sector A',
    formula: 'marketPower / productivityA',
    description: 'Unit price in sector A.',
    unit: 'price per unit',
    role: 'Determines real wages and welfare.',
  },
  {
    id: 'priceB',
    name: 'Price: sector B',
    formula: 'marketPower / productivityB',
    description: 'Unit price in sector B.',
    unit: 'price per unit',
    role: 'Determines real wages and welfare.',
  },
  {
    id: 'outputA',
    name: 'Output: sector A',
    formula: 'productivityA * laborA',
    description: 'Total output from sector A.',
    unit: 'output units',
    role: 'Feeds total production.',
  },
  {
    id: 'outputB',
    name: 'Output: sector B',
    formula: 'productivityB * laborB',
    description: 'Total output from sector B.',
    unit: 'output units',
    role: 'Feeds total production.',
  },
  {
    id: 'wage',
    name: 'Average wage',
    formula: '(productivityA * laborA + productivityB * laborB) / laborSupply * (1 - marketPower * 0.1)',
    description: 'Average wage paid to workers.',
    unit: 'currency per labor',
    role: 'Determines labor income.',
  },
  {
    id: 'inequalityIndex',
    name: 'Inequality index',
    formula:
      'max(0, min(1, royaltyRate + ipProtection * 0.3 + marketPower * 0.1 - antitrustStrength * 0.2))',
    description: 'Simple index of distributional imbalance.',
    unit: 'index',
    role: 'Feeds welfare metrics.',
  },
  {
    id: 'liquidityIndex',
    name: 'Liquidity index',
    formula: '1 + currencyMixCommons * 0.2 + currencyMixTime * 0.15',
    description: 'Effective liquidity from multiple currency systems.',
    unit: 'index',
    role: 'Scales effective demand.',
  },
  {
    id: 'totalOutput',
    name: 'Total output',
    formula: 'outputA + outputB',
    description: 'Combined output across sectors.',
    unit: 'output units',
    role: 'Feeds welfare and growth metrics.',
  },
  {
    id: 'welfareIndex',
    name: 'Welfare index',
    formula:
      '(welfareWeightGrowth * log(1 + totalOutput) + (1 - welfareWeightGrowth) * (1 - inequalityIndex)) * (1 - inequalityAversion * inequalityIndex * 0.5)',
    description: 'Composite welfare that trades off growth and equity.',
    unit: 'index',
    role: 'Tracks social wellbeing.',
  },
  {
    id: 'alternativeWelfare',
    name: 'Plural welfare index',
    formula: 'welfareIndex * (1 + currencyMixCommons * 0.3 + currencyMixTime * 0.2)',
    description: 'Alternative welfare accounting for plural value metrics.',
    unit: 'index',
    role: 'Shows plural value measures.',
  },
];

export const buildDependencyGraph = (): Record<string, string[]> => {
  const graph: Record<string, string[]> = {};
  const ids = computedVariables.map((variable) => variable.id);
  for (const variable of computedVariables) {
    const validation = validateFormula(variable.formula, ids);
    graph[variable.id] = validation.variables;
  }
  return graph;
};

const evaluateComputedVariables = (
  formulas: Record<string, string>,
  context: Record<string, number>,
): { values: Record<string, number>; log: string[] } => {
  const values: Record<string, number> = {};
  const log: string[] = [];
  const queue = computedVariables.map((variable) => variable.id);

  for (const id of queue) {
    const formula = formulas[id];
    const result = safeEvaluateFormula(formula, { ...context, ...values });
    if (result.error) {
      log.push(`Formula error for ${id}: ${result.error}`);
      values[id] = 0;
    } else if (result.value !== undefined) {
      values[id] = result.value;
    }
  }

  return { values, log };
};

export const createInitialState = (model: ModelDefinition): ModelState => {
  const paramValues = Object.fromEntries(
    model.parameters.map((parameter) => [parameter.id, parameter.value]),
  );
  return {
    step: 0,
    values: {
      productivityA: paramValues.productivityA ?? 1,
      productivityB: paramValues.productivityB ?? 1,
      ...paramValues,
    },
    sectorOutputs: {},
    sectorPrices: {},
    wage: 0,
    innovationRate: 0,
    diffusionRate: 0,
    inequalityIndex: 0,
    welfareIndex: 0,
    alternativeWelfare: 0,
    log: [],
  };
};

export const simulateStep = (
  prev: ModelState,
  formulas: Record<string, string>,
): ModelState => {
  const context = { ...prev.values };
  const { values, log } = evaluateComputedVariables(formulas, context);

  const productivityA =
    prev.values.productivityA *
      (1 + (values.innovationRate ?? 0) - (values.diffusionRate ?? 0) * 0.2) +
    (values.diffusionRate ?? 0) * (prev.values.productivityB - prev.values.productivityA);
  const productivityB =
    prev.values.productivityB *
      (1 + (values.innovationRate ?? 0) - (values.diffusionRate ?? 0) * 0.2) +
    (values.diffusionRate ?? 0) * (prev.values.productivityA - prev.values.productivityB);

  const nextValues = {
    ...prev.values,
    productivityA: Math.max(0.1, productivityA),
    productivityB: Math.max(0.1, productivityB),
    ...values,
  };

  return {
    step: prev.step + 1,
    values: nextValues,
    sectorOutputs: {
      sectorA: nextValues.outputA ?? 0,
      sectorB: nextValues.outputB ?? 0,
    },
    sectorPrices: {
      sectorA: nextValues.priceA ?? 0,
      sectorB: nextValues.priceB ?? 0,
    },
    wage: nextValues.wage ?? 0,
    innovationRate: nextValues.innovationRate ?? 0,
    diffusionRate: nextValues.diffusionRate ?? 0,
    inequalityIndex: nextValues.inequalityIndex ?? 0,
    welfareIndex: nextValues.welfareIndex ?? 0,
    alternativeWelfare: nextValues.alternativeWelfare ?? 0,
    log: [...prev.log, ...log],
  };
};

export const runSimulation = (
  model: ModelDefinition,
  formulas: Record<string, string>,
  steps = 12,
): SimulationResult => {
  const history: ModelState[] = [];
  let current = createInitialState(model);
  history.push(current);
  for (let i = 0; i < steps; i += 1) {
    current = simulateStep(current, formulas);
    history.push(current);
  }
  return {
    history,
    dependencyGraph: buildDependencyGraph(),
  };
};

export const getDefaultFormulas = (): Record<string, string> =>
  Object.fromEntries(computedVariables.map((variable) => [variable.id, variable.formula]));

export const getComputedDefinitions = () => computedVariables;

export const validateAllFormulas = (
  formulas: Record<string, string>,
  allowedVariables: string[],
) => {
  const errors: Record<string, string | undefined> = {};
  computedVariables.forEach((variable) => {
    const validation = validateFormula(formulas[variable.id], allowedVariables);
    if (!validation.isValid) {
      errors[variable.id] = validation.error;
    }
  });
  return errors;
};

export const evaluateFormulaSnapshot = (
  formulas: Record<string, string>,
  context: Record<string, number>,
) => {
  const result: Record<string, number> = {};
  for (const variable of computedVariables) {
    const ast = parseFormula(formulas[variable.id]);
    result[variable.id] = evaluateFormula(ast, { ...context, ...result });
  }
  return result;
};
