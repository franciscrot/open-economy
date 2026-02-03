import { describe, expect, it } from 'vitest';
import { parseFormula, evaluateFormula, validateFormula } from '../formulas';

describe('formula parser', () => {
  it('evaluates arithmetic and functions safely', () => {
    const ast = parseFormula('max(2, 1 + 3) * 2');
    const value = evaluateFormula(ast, {});
    expect(value).toBe(8);
  });

  it('validates unknown variables', () => {
    const validation = validateFormula('laborSupply + unknownVar', ['laborSupply']);
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain('unknownVar');
  });
});
