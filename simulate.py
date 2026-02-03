"""Discrete-time simulation for the minimal GE core with IP vs Commons."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Params:
    T: int = 30
    Lbar: float = 1.0
    phi: float = 0.6
    delta: float = 0.02
    eta: float = 0.2
    chi: float = 0.05
    lam: float = 0.5
    rho: float = 0.1
    theta_w: float = 0.6
    theta_o: float = 0.5
    s_R: float = 0.3


@dataclass
class State:
    Kp: float
    Kc: float


def step(state: State, params: Params) -> dict:
    """Solve one-period equilibrium and update knowledge stocks."""
    Kp = max(state.Kp, 1e-6)
    Kc = max(state.Kc, 1e-6)

    Ap = Kp ** params.phi
    Ac = (Kc + params.lam * Kp) ** params.phi

    licensing_income = params.rho * params.lam * Kp
    r_and_d = params.s_R * licensing_income
    owner_income = (1 - params.s_R) * licensing_income

    # Wage from labor market identity:
    # Lbar = (w Lbar + (1-s_R) R) / w  -> w Lbar = (1-s_R) R / s_R
    if params.s_R <= 0:
        raise ValueError("s_R must be positive to pin down wages in this toy model.")

    worker_income = (licensing_income * (1 - params.s_R)) / params.s_R
    wage = worker_income / params.Lbar
    spend_p = params.theta_w * worker_income + params.theta_o * owner_income
    spend_c = (1 - params.theta_w) * worker_income + (1 - params.theta_o) * owner_income

    labor_p = spend_p / wage
    labor_c = spend_c / wage

    price_p = wage / Ap
    price_c = wage / Ac

    output_p = Ap * labor_p
    output_c = Ac * labor_c

    Kp_next = (1 - params.delta) * Kp + params.eta * r_and_d
    Kc_next = (1 - params.delta) * Kc + params.chi * output_c + params.lam * Kp

    return {
        "Kp": Kp,
        "Kc": Kc,
        "Ap": Ap,
        "Ac": Ac,
        "wage": wage,
        "price_p": price_p,
        "price_c": price_c,
        "labor_p": labor_p,
        "labor_c": labor_c,
        "output_p": output_p,
        "output_c": output_c,
        "licensing_income": licensing_income,
        "owner_income": owner_income,
        "r_and_d": r_and_d,
        "Kp_next": Kp_next,
        "Kc_next": Kc_next,
    }


def simulate(initial: State, params: Params) -> list[dict]:
    state = initial
    history = []
    for _ in range(params.T):
        result = step(state, params)
        history.append(result)
        state = State(Kp=result["Kp_next"], Kc=result["Kc_next"])
    return history


if __name__ == "__main__":
    params = Params()
    initial_state = State(Kp=1.0, Kc=0.5)
    series = simulate(initial_state, params)
    for t, row in enumerate(series):
        print(
            f"t={t:02d} Kp={row['Kp']:.3f} Kc={row['Kc']:.3f} "
            f"Yp={row['output_p']:.3f} Yc={row['output_c']:.3f} "
            f"w={row['wage']:.3f} p_p={row['price_p']:.3f} p_c={row['price_c']:.3f}"
        )
