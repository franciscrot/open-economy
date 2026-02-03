from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .model import Constraint, EconomicAct, ModelSpec, Rule
from .record import ExecutionRecord, ExecutionRecordEntry


@dataclass
class ExecutionEngine:
    spec: ModelSpec

    def apply_rule(
        self,
        act: EconomicAct,
        state: dict[str, Any],
        rule_id: str,
        constraints: tuple[str, ...] = (),
    ) -> ExecutionRecordEntry:
        rule = self._require_rule(rule_id)
        state_snapshot = dict(state)
        evaluated_constraints: list[str] = []
        blocked_by: list[str] = []
        for constraint_id in constraints:
            constraint = self._require_constraint(constraint_id)
            evaluated_constraints.append(constraint_id)
            if not constraint.evaluator({"state": state_snapshot, "act": act.payload}):
                blocked_by.append(constraint_id)
        if blocked_by:
            return ExecutionRecordEntry.blocked(
                act=act,
                rule=rule,
                constraints=tuple(evaluated_constraints),
                blocked_by=tuple(blocked_by),
                state_before=state_snapshot,
                state_after=state_snapshot,
                spec=self.spec,
            )
        updates = rule.evaluator({"state": state_snapshot, "act": act.payload})
        new_state = {**state_snapshot, **updates}
        return ExecutionRecordEntry.applied(
            act=act,
            rule=rule,
            constraints=tuple(evaluated_constraints),
            state_before=state_snapshot,
            state_after=new_state,
            spec=self.spec,
        )

    def run(
        self,
        acts: tuple[EconomicAct, ...],
        state: dict[str, Any],
        rule_map: dict[str, tuple[str, tuple[str, ...]]],
    ) -> ExecutionRecord:
        record = ExecutionRecord()
        current_state = dict(state)
        for act in acts:
            rule_id, constraints = rule_map[act.act_id]
            entry = self.apply_rule(act, current_state, rule_id, constraints)
            record.entries.append(entry)
            current_state = dict(entry.state_after)
        return record

    def _require_rule(self, rule_id: str) -> Rule:
        if rule_id not in self.spec.rules:
            raise KeyError(f"Unknown rule: {rule_id}")
        return self.spec.rules[rule_id]

    def _require_constraint(self, constraint_id: str) -> Constraint:
        if constraint_id not in self.spec.constraints:
            raise KeyError(f"Unknown constraint: {constraint_id}")
        return self.spec.constraints[constraint_id]
