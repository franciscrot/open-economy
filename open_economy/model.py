from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Iterable


@dataclass(frozen=True)
class Parameter:
    parameter_id: str
    label: str
    description: str = ""
    unit: str = ""


@dataclass(frozen=True)
class Rule:
    rule_id: str
    label: str
    formula_text: str
    evaluator: Callable[[dict[str, Any]], dict[str, Any]]
    referenced_parameters: tuple[str, ...] = ()


@dataclass(frozen=True)
class Constraint:
    constraint_id: str
    label: str
    formula_text: str
    evaluator: Callable[[dict[str, Any]], bool]
    referenced_parameters: tuple[str, ...] = ()
    reason_template: str = ""


@dataclass(frozen=True)
class EconomicAct:
    act_id: str
    act_type: str
    description: str
    payload: dict[str, Any]


@dataclass(frozen=True)
class ValueMetric:
    metric_id: str
    label: str
    description: str = ""


@dataclass(frozen=True)
class TradeOff:
    tradeoff_id: str
    metrics: tuple[str, ...]
    narrative_template: str


@dataclass
class ModelSpec:
    parameters: dict[str, Parameter] = field(default_factory=dict)
    rules: dict[str, Rule] = field(default_factory=dict)
    constraints: dict[str, Constraint] = field(default_factory=dict)
    metrics: dict[str, ValueMetric] = field(default_factory=dict)
    tradeoffs: dict[str, TradeOff] = field(default_factory=dict)

    def rename_parameter(self, parameter_id: str, new_label: str) -> None:
        if parameter_id not in self.parameters:
            raise KeyError(f"Unknown parameter: {parameter_id}")
        parameter = self.parameters[parameter_id]
        self.parameters[parameter_id] = Parameter(
            parameter_id=parameter.parameter_id,
            label=new_label,
            description=parameter.description,
            unit=parameter.unit,
        )

    def rename_rule(self, rule_id: str, new_label: str) -> None:
        if rule_id not in self.rules:
            raise KeyError(f"Unknown rule: {rule_id}")
        rule = self.rules[rule_id]
        self.rules[rule_id] = Rule(
            rule_id=rule.rule_id,
            label=new_label,
            formula_text=rule.formula_text,
            evaluator=rule.evaluator,
            referenced_parameters=rule.referenced_parameters,
        )

    def rename_metric(self, metric_id: str, new_label: str) -> None:
        if metric_id not in self.metrics:
            raise KeyError(f"Unknown metric: {metric_id}")
        metric = self.metrics[metric_id]
        self.metrics[metric_id] = ValueMetric(
            metric_id=metric.metric_id,
            label=new_label,
            description=metric.description,
        )

    def describe_parameter(self, parameter_id: str) -> str:
        parameter = self.parameters.get(parameter_id)
        if not parameter:
            return parameter_id
        if parameter.unit:
            return f"{parameter.label} [{parameter.unit}]"
        return parameter.label

    def describe_rule(self, rule_id: str) -> str:
        rule = self.rules.get(rule_id)
        if not rule:
            return rule_id
        return rule.label

    def describe_constraint(self, constraint_id: str) -> str:
        constraint = self.constraints.get(constraint_id)
        if not constraint:
            return constraint_id
        return constraint.label

    def describe_metric(self, metric_id: str) -> str:
        metric = self.metrics.get(metric_id)
        if not metric:
            return metric_id
        return metric.label

    def tradeoff_narrative(self, tradeoff_id: str) -> str:
        tradeoff = self.tradeoffs.get(tradeoff_id)
        if not tradeoff:
            return tradeoff_id
        labels = [self.describe_metric(metric_id) for metric_id in tradeoff.metrics]
        if tradeoff.narrative_template:
            return tradeoff.narrative_template.format(metrics=", ".join(labels))
        return f"Trade-off between {', '.join(labels)}"

    def iter_parameter_labels(self, parameter_ids: Iterable[str]) -> list[str]:
        return [self.describe_parameter(parameter_id) for parameter_id in parameter_ids]

    def describe_reference(self, reference_type: str, reference_id: str) -> str:
        if reference_type == "rule":
            return self.describe_rule(reference_id)
        if reference_type == "parameter":
            return self.describe_parameter(reference_id)
        if reference_type == "constraint":
            return self.describe_constraint(reference_id)
        if reference_type == "metric":
            return self.describe_metric(reference_id)
        return reference_id
