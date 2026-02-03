import { describe, expect, it } from 'vitest';
import { getDefaultFormulas, runSimulation } from '../engine';
import { defaultModelDefinition } from '../presets';

describe('model engine', () => {
  it('runs a simulation with positive outputs', () => {
    const formulas = getDefaultFormulas();
    const result = runSimulation(defaultModelDefinition, formulas, 3);
    const last = result.history[result.history.length - 1];
    expect(last.wage).toBeGreaterThan(0);
    expect(last.sectorOutputs.sectorA).toBeGreaterThan(0);
    expect(last.sectorOutputs.sectorB).toBeGreaterThan(0);
  });
});
