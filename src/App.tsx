import React, { useMemo, useState } from 'react';
import ChartPanel from './components/ChartPanel';
import ModelInspector from './components/ModelInspector';
import ParameterStudio from './components/ParameterStudio';
import ScenarioLog from './components/ScenarioLog';
import Tooltip from './components/Tooltip';
import {
  computedVariables,
  getComputedDefinitions,
  getDefaultFormulas,
  runSimulation,
  validateAllFormulas,
  evaluateFormulaSnapshot,
} from './model/engine';
import { defaultModelDefinition } from './model/presets';
import { ModelDefinition, Sector } from './model/types';
import { getAllowedFunctions } from './model/formulas';

const cloneModel = (model: ModelDefinition) => ({
  ...model,
  sectors: model.sectors.map((sector) => ({ ...sector })),
  households: model.households.map((household) => ({ ...household })),
  parameters: model.parameters.map((parameter) => ({ ...parameter })),
  policyPresets: model.policyPresets.map((preset) => ({
    ...preset,
    parameterOverrides: { ...preset.parameterOverrides },
  })),
  currencySystems: model.currencySystems.map((currency) => ({ ...currency })),
});

const App: React.FC = () => {
  const [model, setModel] = useState<ModelDefinition>(() => cloneModel(defaultModelDefinition));
  const [formulas, setFormulas] = useState<Record<string, string>>(() => getDefaultFormulas());
  const [selectedPreset, setSelectedPreset] = useState('default');

  const parameterValues = useMemo(
    () => Object.fromEntries(model.parameters.map((parameter) => [parameter.id, parameter.value])),
    [model.parameters],
  );

  const allowedVariables = useMemo(
    () => [
      ...model.parameters.map((parameter) => parameter.id),
      ...computedVariables.map((variable) => variable.id),
      'productivityA',
      'productivityB',
    ],
    [model.parameters],
  );

  const formulaErrors = useMemo(
    () => validateAllFormulas(formulas, allowedVariables),
    [formulas, allowedVariables],
  );

  const computedSnapshot = useMemo(() => {
    try {
      return evaluateFormulaSnapshot(formulas, {
        ...parameterValues,
        productivityA: parameterValues.productivityA ?? 1,
        productivityB: parameterValues.productivityB ?? 1,
      });
    } catch (error) {
      return {};
    }
  }, [formulas, parameterValues]);

  const simulation = useMemo(() => runSimulation(model, formulas, 12), [model, formulas]);

  const handleParameterChange = (id: string, value: number) => {
    setModel((prev) => ({
      ...prev,
      parameters: prev.parameters.map((parameter) =>
        parameter.id === id ? { ...parameter, value } : parameter,
      ),
    }));
  };

  const handleParameterRename = (id: string, name: string) => {
    setModel((prev) => ({
      ...prev,
      parameters: prev.parameters.map((parameter) =>
        parameter.id === id ? { ...parameter, name } : parameter,
      ),
    }));
  };

  const handleFormulaChange = (id: string, formula: string) => {
    setFormulas((prev) => ({ ...prev, [id]: formula }));
  };

  const handleSectorRename = (id: string, name: string) => {
    setModel((prev) => ({
      ...prev,
      sectors: prev.sectors.map((sector) => (sector.id === id ? { ...sector, name } : sector)),
    }));
  };

  const handlePresetChange = (presetId: string) => {
    const preset = model.policyPresets.find((item) => item.id === presetId);
    if (!preset) return;
    setSelectedPreset(presetId);
    setModel((prev) => ({
      ...prev,
      parameters: prev.parameters.map((parameter) => ({
        ...parameter,
        value: preset.parameterOverrides[parameter.id] ?? parameter.value,
      })),
    }));
  };

  const resetDefaults = () => {
    setModel(cloneModel(defaultModelDefinition));
    setFormulas(getDefaultFormulas());
    setSelectedPreset('default');
  };

  const sectorNames = useMemo(
    () => ({
      sectorA: model.sectors[0]?.name ?? 'Sector A',
      sectorB: model.sectors[1]?.name ?? 'Sector B',
    }),
    [model.sectors],
  );

  return (
    <div className="app">
      <header className="hero">
        <div>
          <h1>Open Economy Lab</h1>
          <p>
            A small, readable general equilibrium sandbox with an explicit IP/open-source policy
            layer and plural currency systems. Every variable has a plain-language tooltip.
          </p>
          <div className="row">
            <span className="badge">2 sectors</span>
            <span className="badge">2 household types</span>
            <span className="badge">Innovation + diffusion</span>
          </div>
        </div>
        <div className="hero-card">
          <h3>Policy presets</h3>
          <p>Explore six scenarios that alter licensing, antitrust, and currency mixes.</p>
          <select value={selectedPreset} onChange={(event) => handlePresetChange(event.target.value)}>
            {model.policyPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={resetDefaults}>
            Reset to defaults
          </button>
          <div className="preset-note">
            {model.policyPresets.find((preset) => preset.id === selectedPreset)?.description}
          </div>
        </div>
      </header>

      <section className="panel">
        <h2>Minimal model design</h2>
        <div className="grid two">
          <div>
            <h3>Variables & equilibrium</h3>
            <ul>
              <li>
                Two sectors ({sectorNames.sectorA}, {sectorNames.sectorB}) split labor and set output
                by productivity.
              </li>
              <li>
                Prices are markups over unit cost, with market power shaped by IP rules and
                antitrust.
              </li>
              <li>
                Wages follow average productivity minus market power effects.
              </li>
            </ul>
          </div>
          <div>
            <h3>Timing</h3>
            <ul>
              <li>Each step updates innovation and diffusion.</li>
              <li>Productivity evolves based on those rates.</li>
              <li>Outputs, prices, and welfare indices update after productivity.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>IP + open-source policy knobs</h2>
        <div className="grid two">
          <div>
            <ul>
              <li>
                IP protection strength <Tooltip text="How strict patent-like rights are." />
              </li>
              <li>
                Open source adoption <Tooltip text="Share of innovations released openly." />
              </li>
              <li>
                Royalty rate <Tooltip text="How much revenue is paid to rights holders." />
              </li>
              <li>
                Public R&amp;D funding <Tooltip text="Public support for innovation." />
              </li>
              <li>
                Antitrust strength <Tooltip text="Competition policy intensity." />
              </li>
              <li>
                Platform openness <Tooltip text="Interoperability and open standards." />
              </li>
            </ul>
          </div>
          <div>
            <h3>Speculative currency system</h3>
            <p>
              Users can adjust complementary liquidity via commons and time currencies. These
              influence the liquidity index and plural welfare measures.
            </p>
            <ul>
              {model.currencySystems.map((currency) => (
                <li key={currency.id}>
                  {currency.name}: {currency.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <ParameterStudio
        parameters={model.parameters}
        computed={getComputedDefinitions()}
        formulas={formulas}
        formulaErrors={formulaErrors}
        computedValues={computedSnapshot}
        sectors={model.sectors as Sector[]}
        onParameterChange={handleParameterChange}
        onParameterRename={handleParameterRename}
        onFormulaChange={handleFormulaChange}
        onSectorRename={handleSectorRename}
      />

      <ModelInspector
        computed={computedVariables}
        dependencyGraph={simulation.dependencyGraph}
      />

      <ChartPanel history={simulation.history} sectorNames={sectorNames} />

      <section className="panel">
        <h2>Formula guardrails</h2>
        <p>
          Editable formulas allow only basic arithmetic, parentheses, and safe functions. Allowed
          functions: {getAllowedFunctions().join(', ')}.
        </p>
      </section>

      <ScenarioLog history={simulation.history} />
    </div>
  );
};

export default App;
