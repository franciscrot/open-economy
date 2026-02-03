import unittest

from open_economy import (
    Constraint,
    EconomicAct,
    ExecutionEngine,
    ModelSpec,
    Parameter,
    ReasoningView,
    Rule,
)


class ExecutionModelTests(unittest.TestCase):
    def setUp(self) -> None:
        self.spec = ModelSpec(
            parameters={
                "profit": Parameter("profit", "Profit", unit="credits"),
            },
            rules={
                "compute_profit": Rule(
                    rule_id="compute_profit",
                    label="Compute Profit",
                    formula_text="profit = revenue - cost",
                    evaluator=lambda ctx: {
                        "profit": ctx["state"].get("revenue", 0)
                        - ctx["state"].get("cost", 0)
                    },
                    referenced_parameters=("profit",),
                ),
            },
            constraints={
                "budget_guard": Constraint(
                    constraint_id="budget_guard",
                    label="Budget Guard",
                    formula_text="revenue >= cost",
                    evaluator=lambda ctx: ctx["state"].get("revenue", 0)
                    >= ctx["state"].get("cost", 0),
                    referenced_parameters=("profit",),
                )
            },
        )

    def test_labels_update_after_rename(self) -> None:
        engine = ExecutionEngine(self.spec)
        act = EconomicAct(
            act_id="act-1",
            act_type="update",
            description="Compute updated profit.",
            payload={},
        )
        record = engine.run(
            (act,),
            {"revenue": 10, "cost": 4},
            {"act-1": ("compute_profit", ())},
        )
        self.spec.rename_parameter("profit", "Care-Debt")
        self.spec.rename_rule("compute_profit", "Compute Care-Debt")
        entry_text = record.entries[0].to_human_readable(self.spec)
        self.assertIn("Compute Care-Debt", entry_text)
        self.assertIn("parameter:Care-Debt [credits]", entry_text)

    def test_reasoning_view_reports_blocked_acts(self) -> None:
        engine = ExecutionEngine(self.spec)
        act = EconomicAct(
            act_id="act-2",
            act_type="update",
            description="Attempt compute.",
            payload={},
        )
        record = engine.run(
            (act,),
            {"revenue": 2, "cost": 6},
            {"act-2": ("compute_profit", ("budget_guard",))},
        )
        view = ReasoningView(record, self.spec)
        blocked = view.as_dict()["blocked_acts"]
        self.assertEqual(len(blocked), 1)
        self.assertIn("Budget Guard", blocked[0]["blocked_by"][0])


if __name__ == "__main__":
    unittest.main()
