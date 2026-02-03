# Open Economy: Explainable Execution Model

This repository defines a minimal economic model runtime that makes **explanation, traceability, and interpretability** structural properties of the system.

## Design Goals

1. **Causal execution record**
   - Every economic act produces a structured, human-readable record entry.
   - Entries point directly at the rule, parameters, and constraints that produced them.
   - State transitions and intermediate quantities are captured explicitly.

2. **Reasoning view on demand**
   - Intermediate quantities and blocked acts are surfaced as first-class outputs.
   - Trade-offs between plural value metrics are explicitly narrated.

3. **Explanation survives user mutation**
   - Descriptions and labels are generated dynamically from the model specification.
   - Renaming a parameter or metric automatically updates the execution record view.

## Files

- `open_economy/model.py`: core model data structures (rules, constraints, parameters, trade-offs).
- `open_economy/engine.py`: execution engine that applies rules and records outcomes.
- `open_economy/record.py`: structured execution record, references, and human-readable output.
- `open_economy/reasoning.py`: reasoning view for intermediate values, blocked acts, and trade-offs.

## Example Usage

```python
from open_economy import (
    Constraint,
    EconomicAct,
    ExecutionEngine,
    ModelSpec,
    Parameter,
    ReasoningView,
    Rule,
    TradeOff,
    ValueMetric,
)

spec = ModelSpec(
    parameters={
        "care_debt": Parameter("care_debt", "Care Debt", unit="hours"),
    },
    rules={
        "allocate_care": Rule(
            rule_id="allocate_care",
            label="Allocate Care",
            formula_text="care_debt = care_debt + care_hours",
            evaluator=lambda ctx: {
                "care_debt": ctx["state"].get("care_debt", 0) + ctx["act"]["care_hours"],
                "care_debt_intermediate": ctx["act"]["care_hours"],
            },
            referenced_parameters=("care_debt",),
        ),
    },
    constraints={
        "capacity": Constraint(
            constraint_id="capacity",
            label="Capacity Limit",
            formula_text="care_hours <= available_hours",
            evaluator=lambda ctx: ctx["act"]["care_hours"] <= ctx["state"].get("available_hours", 0),
            referenced_parameters=("care_debt",),
        )
    },
    metrics={
        "equity": ValueMetric("equity", "Equity"),
        "efficiency": ValueMetric("efficiency", "Efficiency"),
    },
    tradeoffs={
        "equity_efficiency": TradeOff(
            tradeoff_id="equity_efficiency",
            metrics=("equity", "efficiency"),
            narrative_template="Balancing {metrics} in care allocation.",
        )
    },
)

engine = ExecutionEngine(spec)
act = EconomicAct(
    act_id="act-1",
    act_type="care-allocation",
    description="Allocate community care hours.",
    payload={"care_hours": 4},
)
record = engine.run((act,), {"available_hours": 3}, {"act-1": ("allocate_care", ("capacity",))})

view = ReasoningView(record, spec)
print(view.as_dict())
```
