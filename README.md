# Open Economy Lab: A Beginner-Friendly Guide

Open Economy Lab is a **small, interactive economics sandbox**. It helps you explore how policy choices (like IP rules, open-source adoption, and complementary currencies) affect a two‑sector economy over time. The repository also includes a **Python explainable-execution engine** that records every economic action with transparent reasoning.

You can:
- Run the **React web app** to tweak parameters and watch charts update.
- Use the **Python runtime** to build your own explainable economic rules and trace their effects.

---

## 1) Quick Start: Interactive Web App

### Prerequisites
- Node.js 18+ (for Vite + React)

### Run locally
```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173`).

### What you’ll see
- **Policy presets** to instantly explore different scenarios.
- **Parameter Studio** to rename parameters, change values, and edit formulas.
- **Outcome charts** that update after each tweak.
- **Model Inspector** that shows equations and dependencies in plain language.

---

## 2) How to Use the UI

1. **Pick a preset**
   - Use the “Policy presets” dropdown to switch between scenarios (e.g., “Open commons acceleration” or “Platform feudalism”).

2. **Edit parameters**
   - In **Parameter Studio**, update numeric values like “IP protection strength” or “Public R&D funding.”

3. **Edit formulas safely**
   - Formulas accept only basic math and safe functions (`min`, `max`, `log`, `exp`, `abs`).
   - If a formula is invalid, you’ll see a warning message and the model falls back to safe defaults.

4. **Read the outputs**
   - Charts show wages, prices, outputs, innovation, and welfare measures over time.
   - The **Scenario Log** shows step-by-step results and any formula warnings.

---

## 3) Python Explainable Execution Engine (Optional)

The `open_economy/` package is a minimal economic execution engine focused on **traceability**. Every “act” is logged with:
- The rule applied
- The parameters referenced
- Any constraints that blocked the action
- State changes and intermediate values

### Example
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

---

## 4) Project Structure (What’s Where)

### Web app (React + Vite)
- `src/App.tsx` — Main UI layout and interaction wiring.
- `src/components/` — UI panels (charts, tooltips, inspector, etc.).
- `src/model/` — Simulation logic, formulas, and presets.

### Python engine
- `open_economy/model.py` — Core data structures (rules, parameters, constraints).
- `open_economy/engine.py` — Execution engine that applies rules.
- `open_economy/record.py` — Execution record and human-readable output.
- `open_economy/reasoning.py` — Reasoning view for blocked acts and intermediates.

---

## 5) Testing

### Web app
```bash
npm run test
```

### Python engine
```bash
python -m unittest
```

---

## 6) Common Troubleshooting

- **The app doesn’t load**: run `npm install` first, then `npm run dev`.
- **Formula errors**: double-check variable names and functions (`min`, `max`, `log`, `exp`, `abs`).
- **Weird numbers**: extreme parameter values can cause unstable results. Reset to defaults using the button in the UI.
