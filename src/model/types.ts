export type Sector = {
  id: string;
  name: string;
};

export type Household = {
  id: string;
  name: string;
};

export type Parameter = {
  id: string;
  name: string;
  value: number;
  unit: string;
  description: string;
  formula?: string;
  role: string;
};

export type PolicyPreset = {
  id: string;
  name: string;
  description: string;
  parameterOverrides: Record<string, number>;
};

export type ModelDefinition = {
  sectors: Sector[];
  households: Household[];
  parameters: Parameter[];
  policyPresets: PolicyPreset[];
  currencySystems: CurrencySystem[];
};

export type CurrencySystem = {
  id: string;
  name: string;
  description: string;
  liquidityMultiplier: number;
  velocity: number;
};

export type ModelState = {
  step: number;
  values: Record<string, number>;
  sectorOutputs: Record<string, number>;
  sectorPrices: Record<string, number>;
  wage: number;
  innovationRate: number;
  diffusionRate: number;
  inequalityIndex: number;
  welfareIndex: number;
  alternativeWelfare: number;
  log: string[];
};

export type SimulationResult = {
  history: ModelState[];
  dependencyGraph: Record<string, string[]>;
};
