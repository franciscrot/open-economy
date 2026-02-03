from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from .model import EconomicAct, ModelSpec, Rule


@dataclass
class ReferenceLink:
    reference_type: str
    reference_id: str


@dataclass
class ExecutionRecordEntry:
    entry_id: str
    timestamp: str
    act_id: str
    act_type: str
    description: str
    rule_id: str
    rule_formula: str
    constraints_evaluated: tuple[str, ...]
    constraints_blocking: tuple[str, ...]
    state_before: dict[str, Any]
    state_after: dict[str, Any]
    intermediate: dict[str, Any]
    references: tuple[ReferenceLink, ...]
    status: str
    notes: str

    @classmethod
    def applied(
        cls,
        act: EconomicAct,
        rule: Rule,
        constraints: tuple[str, ...],
        state_before: dict[str, Any],
        state_after: dict[str, Any],
        spec: ModelSpec,
    ) -> "ExecutionRecordEntry":
        references = _build_references(spec, rule, constraints)
        intermediate = _extract_intermediate(state_before, state_after)
        return cls(
            entry_id=_entry_id(act.act_id, rule.rule_id),
            timestamp=datetime.utcnow().isoformat() + "Z",
            act_id=act.act_id,
            act_type=act.act_type,
            description=act.description,
            rule_id=rule.rule_id,
            rule_formula=rule.formula_text,
            constraints_evaluated=constraints,
            constraints_blocking=(),
            state_before=state_before,
            state_after=state_after,
            intermediate=intermediate,
            references=references,
            status="applied",
            notes="Rule applied successfully.",
        )

    @classmethod
    def blocked(
        cls,
        act: EconomicAct,
        rule: Rule,
        constraints: tuple[str, ...],
        blocked_by: tuple[str, ...],
        state_before: dict[str, Any],
        state_after: dict[str, Any],
        spec: ModelSpec,
    ) -> "ExecutionRecordEntry":
        references = _build_references(spec, rule, constraints)
        constraint_labels = [spec.describe_constraint(cid) for cid in blocked_by]
        return cls(
            entry_id=_entry_id(act.act_id, rule.rule_id),
            timestamp=datetime.utcnow().isoformat() + "Z",
            act_id=act.act_id,
            act_type=act.act_type,
            description=act.description,
            rule_id=rule.rule_id,
            rule_formula=rule.formula_text,
            constraints_evaluated=constraints,
            constraints_blocking=blocked_by,
            state_before=state_before,
            state_after=state_after,
            intermediate={},
            references=references,
            status="blocked",
            notes=f"Blocked by constraints: {', '.join(constraint_labels)}",
        )

    def to_human_readable(self, spec: ModelSpec) -> str:
        lines = [
            f"[{self.timestamp}] Act {self.act_id} ({self.act_type}): {self.description}",
            f"Rule: {spec.describe_rule(self.rule_id)} ({self.rule_id})",
            f"Formula: {self.rule_formula}",
        ]
        if self.constraints_evaluated:
            labels = [spec.describe_constraint(cid) for cid in self.constraints_evaluated]
            lines.append(f"Constraints evaluated: {', '.join(labels)}")
        if self.constraints_blocking:
            labels = [spec.describe_constraint(cid) for cid in self.constraints_blocking]
            lines.append(f"Blocked by: {', '.join(labels)}")
        if self.references:
            references = ", ".join(
                f"{ref.reference_type}:{spec.describe_reference(ref.reference_type, ref.reference_id)} "
                f"({ref.reference_id})"
                for ref in self.references
            )
            lines.append(f"References: {references}")
        lines.append(f"Status: {self.status}")
        if self.intermediate:
            lines.append("Intermediate quantities:")
            for key, value in self.intermediate.items():
                lines.append(f"  - {key}: {value}")
        lines.append("State changes:")
        for key in sorted(set(self.state_before) | set(self.state_after)):
            before = self.state_before.get(key)
            after = self.state_after.get(key)
            if before != after:
                lines.append(f"  - {key}: {before} -> {after}")
        lines.append(f"Notes: {self.notes}")
        return "\n".join(lines)


@dataclass
class ExecutionRecord:
    entries: list[ExecutionRecordEntry] = field(default_factory=list)

    def to_human_readable(self, spec: ModelSpec) -> str:
        return "\n\n".join(entry.to_human_readable(spec) for entry in self.entries)

    def blocked_entries(self) -> list[ExecutionRecordEntry]:
        return [entry for entry in self.entries if entry.status == "blocked"]

    def applied_entries(self) -> list[ExecutionRecordEntry]:
        return [entry for entry in self.entries if entry.status == "applied"]


def _entry_id(act_id: str, rule_id: str) -> str:
    return f"{act_id}:{rule_id}"


def _build_references(
    spec: ModelSpec, rule: Rule, constraints: tuple[str, ...]
) -> tuple[ReferenceLink, ...]:
    links: list[ReferenceLink] = []
    links.append(ReferenceLink("rule", rule.rule_id))
    for parameter_id in rule.referenced_parameters:
        links.append(ReferenceLink("parameter", parameter_id))
    for constraint_id in constraints:
        links.append(ReferenceLink("constraint", constraint_id))
    return tuple(links)


def _extract_intermediate(
    state_before: dict[str, Any], state_after: dict[str, Any]
) -> dict[str, Any]:
    intermediate: dict[str, Any] = {}
    for key, value in state_after.items():
        if key.endswith("_intermediate"):
            intermediate[key] = value
    return intermediate
