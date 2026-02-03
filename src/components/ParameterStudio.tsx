import React from 'react';
import Tooltip from './Tooltip';
import { ComputedVariable } from '../model/engine';
import { Parameter, Sector } from '../model/types';

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 4,
});

type ParameterStudioProps = {
  parameters: Parameter[];
  computed: ComputedVariable[];
  formulas: Record<string, string>;
  formulaErrors: Record<string, string | undefined>;
  computedValues: Record<string, number>;
  sectors: Sector[];
  onParameterChange: (id: string, value: number) => void;
  onParameterRename: (id: string, name: string) => void;
  onFormulaChange: (id: string, formula: string) => void;
  onSectorRename: (id: string, name: string) => void;
};

const ParameterStudio: React.FC<ParameterStudioProps> = ({
  parameters,
  computed,
  formulas,
  formulaErrors,
  computedValues,
  sectors,
  onParameterChange,
  onParameterRename,
  onFormulaChange,
  onSectorRename,
}) => (
  <section className="panel">
    <h2>Parameter Studio</h2>
    <p className="panel-intro">
      Adjust values, rename parameters or sectors, and edit formulas. Guardrails ensure only safe
      math functions run.
    </p>
    <div className="grid two">
      <div>
        <h3>Rename sectors</h3>
        {sectors.map((sector) => (
          <label key={sector.id} className="row">
            <span className="label">{sector.id}</span>
            <input
              value={sector.name}
              onChange={(event) => onSectorRename(sector.id, event.target.value)}
            />
          </label>
        ))}
        <h3>Core parameters</h3>
        {parameters.map((parameter) => (
          <div key={parameter.id} className="card">
            <div className="row">
              <label className="label">Name</label>
              <input
                value={parameter.name}
                onChange={(event) => onParameterRename(parameter.id, event.target.value)}
              />
            </div>
            <div className="row">
              <label className="label">Value</label>
              <input
                type="number"
                step="0.01"
                value={parameter.value}
                onChange={(event) => onParameterChange(parameter.id, Number(event.target.value))}
              />
            </div>
            <div className="row">
              <span className="label">Unit</span>
              <span>{parameter.unit}</span>
            </div>
            <div className="row">
              <span className="label">Role</span>
              <span>{parameter.role}</span>
            </div>
            <div className="row description">
              <span className="label">Meaning</span>
              <span>
                {parameter.description} <Tooltip text={parameter.description} />
              </span>
            </div>
          </div>
        ))}
      </div>
      <div>
        <h3>Editable formulas</h3>
        {computed.map((variable) => (
          <div key={variable.id} className="card">
            <div className="row">
              <span className="label">{variable.name}</span>
              <Tooltip text={variable.description} />
            </div>
            <div className="row">
              <input
                className={formulaErrors[variable.id] ? 'error' : ''}
                value={formulas[variable.id]}
                onChange={(event) => onFormulaChange(variable.id, event.target.value)}
              />
            </div>
            <div className="row">
              <span className="label">Unit</span>
              <span>{variable.unit}</span>
            </div>
            <div className="row">
              <span className="label">Role</span>
              <span>{variable.role}</span>
            </div>
            {formulaErrors[variable.id] ? (
              <div className="error-message">{formulaErrors[variable.id]}</div>
            ) : (
              <div className="hint">
                Current value: {numberFormatter.format(computedValues[variable.id] ?? 0)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ParameterStudio;
