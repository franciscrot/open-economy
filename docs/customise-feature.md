# Customise (Model Studio) Feature Specification

## Overview
The **Customise** ("Model Studio") feature lets users rename parameters and sectors, edit parameter values, and safely edit functional roles via formulas/rules. The experience is designed for non-economists with plain-language explanations, inline guidance, and safe defaults.

---

## A) JSON Schema

### Parameter JSON (core data)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://open-economy.local/schemas/parameter.json",
  "title": "ModelParameter",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "id",
    "label",
    "description",
    "unit",
    "defaultValue",
    "currentValue",
    "role"
  ],
  "properties": {
    "id": {
      "type": "string",
      "description": "Stable, UUID-like identifier used for references; never changes once created.",
      "pattern": "^[a-z0-9]{8}(-[a-z0-9]{4}){3}-[a-z0-9]{12}$"
    },
    "label": {
      "type": "string",
      "description": "User-editable label shown in the UI.",
      "minLength": 1,
      "maxLength": 140
    },
    "description": {
      "type": "string",
      "description": "User-editable explanation in plain language.",
      "maxLength": 1000
    },
    "unit": {
      "type": "string",
      "description": "Unit of measurement, e.g., %, $/unit, years.",
      "maxLength": 64
    },
    "defaultValue": {
      "description": "Default value shipped with the model.",
      "oneOf": [
        { "type": "number" },
        {
          "type": "array",
          "items": { "type": "number" },
          "minItems": 1
        }
      ]
    },
    "currentValue": {
      "description": "Current user value.",
      "oneOf": [
        { "type": "number" },
        {
          "type": "array",
          "items": { "type": "number" },
          "minItems": 1
        }
      ]
    },
    "role": {
      "type": "string",
      "description": "Functional role reference, e.g., production.elasticity or diffusion.rate.",
      "minLength": 1,
      "maxLength": 120
    },
    "tags": {
      "type": "array",
      "description": "Optional grouping labels for filtering in the UI.",
      "items": { "type": "string" },
      "uniqueItems": true
    }
  }
}
```

### Functional Role / Formula JSON
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://open-economy.local/schemas/formula.json",
  "title": "ModelFormula",
  "type": "object",
  "additionalProperties": false,
  "required": ["id", "label", "role", "expression", "outputType"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z0-9]{8}(-[a-z0-9]{4}){3}-[a-z0-9]{12}$"
    },
    "label": {
      "type": "string",
      "description": "User-editable label for this formula.",
      "minLength": 1,
      "maxLength": 140
    },
    "role": {
      "type": "string",
      "description": "Functional role mapped to an output slot, e.g., production.output.",
      "minLength": 1,
      "maxLength": 120
    },
    "description": {
      "type": "string",
      "description": "User-editable description.",
      "maxLength": 1000
    },
    "expression": {
      "type": "string",
      "description": "Expression in the constrained rule DSL.",
      "minLength": 1,
      "maxLength": 4000
    },
    "outputType": {
      "type": "string",
      "enum": ["number", "boolean", "vector"],
      "description": "Type produced by the formula after checking.",
      "default": "number"
    },
    "dependencies": {
      "type": "array",
      "description": "Optional precomputed list of referenced parameter IDs/roles.",
      "items": { "type": "string" },
      "uniqueItems": true
    },
    "ast": {
      "type": "object",
      "description": "Normalized AST (optional, computed by parser, stored for auditability)."
    },
    "version": {
      "type": "integer",
      "description": "Monotonic version for history and rollback.",
      "minimum": 1
    }
  }
}
```

### Tiny Rule DSL (safe, auditable)
**Grammar (informal)**
```
expr        := ternary
ternary     := or ("?" expr ":" expr)?
or          := and ("||" and)*
and         := compare ("&&" compare)*
compare     := add (("<"|"<="|">"|">="|"=="|"!=") add)*
add         := mul (("+"|"-") mul)*
mul         := unary (("*"|"/"|"%") unary)*
unary       := ("-"|"!") unary | primary
primary     := number | bool | vector | ref | func | "(" expr ")"
ref         := "param" "[" string "]" | "role" "[" string "]"
func        := name "(" args? ")"
args        := expr ("," expr)*
vector      := "[" (expr ("," expr)*)? "]"
```
**Built-in functions**: `min`, `max`, `clamp(x, lo, hi)`, `pow`, `log`, `exp`, `abs`, `sum`, `avg`, `if(cond, a, b)`.

---

## B) Safe Evaluation Strategy + Threat Model

### Safe Evaluation Strategy
1. **Parse into AST**
   - Use a dedicated parser (e.g., `nearley`, `peggy`, `ohm-js`, or a small hand-written Pratt parser).
   - Reject tokens not in the DSL grammar.

2. **Validate (Static Checks)**
   - **Syntax checking**: Ensure the parsed AST is complete and no trailing tokens remain.
   - **Type checking**:
     - Each operator and function has a type signature (e.g., `+` only for numbers, `sum` for vector -> number).
     - `param[...]` and `role[...]` references must resolve to declared output types.
   - **Dependency extraction**:
     - Walk the AST to list all `param[...]` and `role[...]` references.
   - **Recursion/Depth limits**:
     - AST depth and node count capped (e.g., 200 nodes, depth 30).

3. **Sandboxed evaluation (no `eval`)**
   - Evaluate via a pure interpreter that supports only numeric/boolean/vector values.
   - Execution runs in a **time-bounded** context (e.g., 10–25ms per expression). If exceeded, abort evaluation and show a clear error.
   - No access to global objects, network, filesystem, or dynamic code.

4. **Normalized AST + Inspector**
   - Store normalized AST in the formula JSON (optional) for auditability.
   - Render normalized form in UI (e.g., `clamp(param["x"],0,1)`), so users can review the engine’s exact interpretation.

### Threat Model (what we forbid and why)
| Threat | Forbidden Behavior | Mitigation |
|---|---|---|
| Arbitrary code execution | Running JS/TS `eval`, `Function`, or access to globals | Parser+interpreter only; no external execution hooks |
| Denial-of-service | Infinite loops, huge expressions, pathological recursion | Strict AST size/depth caps, timeouts, no loops in DSL |
| Data exfiltration | Network/file access | Interpreter has no I/O primitives |
| Type confusion | Using boolean in arithmetic, etc. | Static type checking and clear errors |
| Silent behavioral change | Hidden edits or ambiguous parsing | Show AST/normalized form in UI |

---

## C) UI Design (Editor + Validation + History)

### Core Layout
- **Left panel: Parameters & Sectors**
  - Search + filters (tags, units, role groups)
  - Editable fields: **Label**, **Description**, **Unit**, **Value**
  - Inline tips: “Labels are just names. IDs stay stable so the model doesn’t break.”

- **Right panel: Formula Studio**
  - Formula editor (monospace) with **syntax highlighting** and **inline hints**
  - **Syntax status** chip: ✅ “Valid” / ❌ “Invalid”
  - **Type status** chip: “Outputs: number / boolean / vector”
  - **AST Inspector**: collapsible panel showing normalized AST

### Validation Messages (examples)
- “`sum()` expects a vector, but you passed a number.”
- “Unknown parameter id: `param["wage_growth"]`.”
- “Expression too complex (exceeds 200 nodes). Try splitting.”

### Preview Impact
- **Dependency graph**
  - Graph or list of `param[...]` and `role[...]` references.
  - Show **downstream outputs** affected via model wiring (e.g., “This formula affects: production.output → employment.demand”).

- **Sample evaluation**
  - Use current model state to compute sample output.
  - Show intermediate values if requested (expandable). 

### Editing Controls
- **Revert** (single formula or parameter) to default or last saved.
- **Version history**
  - Timeline with diff view: “v3 → v4”
  - “Restore version” button

### Accessibility & Guidance
- Inline glossary for non-economists:
  - “Elasticity: how sensitive output is to an input change.”
  - “Diffusion rate: how fast a new tech spreads.”
- “What does this do?” tooltip on each role.

---

## Example Parameter + Formula

```json
{
  "id": "c41f0da2-5d20-4e56-8f76-4c8e4d2a8f90",
  "label": "Learning by doing",
  "description": "How quickly costs fall as production experience grows.",
  "unit": "%",
  "defaultValue": 0.15,
  "currentValue": 0.12,
  "role": "production.elasticity",
  "tags": ["production", "cost"]
}
```

```json
{
  "id": "07dfb8d5-02dc-4ed1-90b0-1df6cd1a6c18",
  "label": "Learning curve adjustment",
  "role": "production.adjustment",
  "description": "Adjusts output based on cumulative production experience.",
  "expression": "param[\"c41f0da2-5d20-4e56-8f76-4c8e4d2a8f90\"] * log(1 + role[\"production.cumulative_output\"])",
  "outputType": "number",
  "version": 1
}
```
