import React from 'react';
import Tooltip from './Tooltip';
import { ComputedVariable } from '../model/engine';

const ModelInspector: React.FC<{
  computed: ComputedVariable[];
  dependencyGraph: Record<string, string[]>;
}> = ({ computed, dependencyGraph }) => (
  <section className="panel">
    <h2>Model Inspector</h2>
    <p className="panel-intro">
      Equations, definitions, and dependency graph for transparency. Hover the info icons for plain
      language explanations.
    </p>
    <div className="grid two">
      <div>
        <h3>Equations & definitions</h3>
        <ul className="list">
          {computed.map((variable) => (
            <li key={variable.id}>
              <div className="row">
                <strong>{variable.name}</strong>
                <Tooltip text={variable.description} />
              </div>
              <div className="formula">{variable.id} = {variable.formula}</div>
              <div className="meta">Unit: {variable.unit}</div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Dependency graph</h3>
        <ul className="list">
          {Object.entries(dependencyGraph).map(([key, deps]) => (
            <li key={key}>
              <div className="row">
                <strong>{key}</strong>
                <span className="meta">depends on: {deps.length ? deps.join(', ') : 'inputs only'}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

export default ModelInspector;
