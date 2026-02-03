import React from 'react';
import { ModelState } from '../model/types';

const ScenarioLog: React.FC<{ history: ModelState[] }> = ({ history }) => (
  <section className="panel">
    <h2>Scenario Log</h2>
    <p className="panel-intro">
      Every step of the simulation, including formula validation warnings.
    </p>
    <div className="log">
      {history.map((state) => (
        <div key={state.step} className="log-entry">
          <strong>Step {state.step}</strong>
          <div>Wage: {state.wage.toFixed(3)}</div>
          <div>Innovation: {state.innovationRate.toFixed(3)}</div>
          <div>Diffusion: {state.diffusionRate.toFixed(3)}</div>
          <div>Welfare: {state.welfareIndex.toFixed(3)}</div>
          {state.log.length > 0 && (
            <ul>
              {state.log.map((entry, index) => (
                <li key={`${state.step}-${index}`}>{entry}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  </section>
);

export default ScenarioLog;
