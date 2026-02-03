from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .model import ModelSpec
from .record import ExecutionRecord, ExecutionRecordEntry


@dataclass
class ReasoningView:
    record: ExecutionRecord
    spec: ModelSpec

    def as_dict(self) -> dict[str, Any]:
        return {
            "intermediate_quantities": self._intermediate_quantities(),
            "blocked_acts": self._blocked_acts(),
            "tradeoffs": self._tradeoffs(),
        }

    def _intermediate_quantities(self) -> list[dict[str, Any]]:
        data: list[dict[str, Any]] = []
        for entry in self.record.entries:
            if entry.intermediate:
                data.append(
                    {
                        "entry_id": entry.entry_id,
                        "rule": self.spec.describe_rule(entry.rule_id),
                        "intermediate": entry.intermediate,
                    }
                )
        return data

    def _blocked_acts(self) -> list[dict[str, Any]]:
        blocked: list[dict[str, Any]] = []
        for entry in self.record.blocked_entries():
            blocked.append(
                {
                    "entry_id": entry.entry_id,
                    "act": entry.act_type,
                    "rule": self.spec.describe_rule(entry.rule_id),
                    "blocked_by": [
                        self.spec.describe_constraint(cid)
                        for cid in entry.constraints_blocking
                    ],
                    "notes": entry.notes,
                }
            )
        return blocked

    def _tradeoffs(self) -> list[str]:
        return [
            self.spec.tradeoff_narrative(tradeoff_id)
            for tradeoff_id in self.spec.tradeoffs
        ]

    def explain_entry(self, entry_id: str) -> str:
        entry = self._find_entry(entry_id)
        if not entry:
            raise KeyError(f"Unknown entry: {entry_id}")
        return entry.to_human_readable(self.spec)

    def _find_entry(self, entry_id: str) -> ExecutionRecordEntry | None:
        for entry in self.record.entries:
            if entry.entry_id == entry_id:
                return entry
        return None
