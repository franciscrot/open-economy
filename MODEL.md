# Open Economy: Minimal GE Core with IP vs Commons

## 1) Variables and parameters (units)

### State variables
- `K_p,t` (ideas stock in proprietary sector; index/level).
- `K_c,t` (ideas stock in commons sector; index/level).

### Choice / flow variables (per period)
- `L_p,t`, `L_c,t` (labor allocated to proprietary/commons; workers).
- `Y_p,t`, `Y_c,t` (outputs of proprietary/commons goods; goods/period).
- `p_p,t`, `p_c,t` (prices of proprietary/commons goods; currency/good).
- `w_t` (wage; currency/worker-period).
- `I_t` (R&D investment by owners; currency/period).
- `R_t` (licensing income to owners; currency/period).
- `C_{w,p,t}`, `C_{w,c,t}` (worker consumption; goods/period).
- `C_{o,p,t}`, `C_{o,c,t}` (owner consumption; goods/period).

### Parameters
- `L̄` (total labor supply by workers; workers/period).
- `φ` (ideas-to-productivity elasticity; unitless, `0 < φ ≤ 1`).
- `δ` (idea depreciation rate; `0 ≤ δ < 1`).
- `η` (R&D productivity; ideas per currency).
- `χ` (commons learning-by-doing coefficient; ideas per goods).
- `λ` (openness / diffusion parameter; `0 ≤ λ ≤ 1`).
- `ρ` (licensing rate for proprietary ideas; currency per idea-period).
- `θ_w` (workers’ expenditure share on proprietary good; `0<θ_w<1`).
- `θ_o` (owners’ expenditure share on proprietary good; `0<θ_o<1`).
- `s_R` (owners’ R&D budget share; `0≤s_R≤1`).

## 2) Equilibrium conditions (households, firms, market clearing)

### Technology
- Productivity in each sector is a function of knowledge:
  - `A_p,t = K_p,t^φ`
  - `A_c,t = (K_c,t + λ K_p,t)^φ`
- Production is linear in labor (simplest competitive structure):
  - `Y_p,t = A_p,t L_p,t`
  - `Y_c,t = A_c,t L_c,t`

### Firms (competitive, zero profit)
- Cost minimization with linear tech implies:
  - `w_t = p_p,t A_p,t`
  - `w_t = p_c,t A_c,t`
  - therefore `p_p,t = w_t / A_p,t`, `p_c,t = w_t / A_c,t`.

### Households
- Workers have wage income `Y_w,t = w_t L̄` and Cobb-Douglas demand:
  - `p_p,t C_{w,p,t} = θ_w Y_w,t`
  - `p_c,t C_{w,c,t} = (1-θ_w) Y_w,t`
- Owners receive licensing income `R_t` (and zero profits) and consume the
  remainder after R&D spending:
  - `I_t = s_R R_t`
  - `Y_o,t = (1-s_R) R_t`
  - `p_p,t C_{o,p,t} = θ_o Y_o,t`
  - `p_c,t C_{o,c,t} = (1-θ_o) Y_o,t`

### Licensing income
- Simple linear rule that links proprietary ideas and openness to licensing:
  - `R_t = ρ λ K_p,t`
  - Interpretation: more openness raises use of proprietary ideas (hence
    royalties), but only the proprietary stock generates licensable revenue.

### Market clearing
- Goods markets:
  - `Y_p,t = C_{w,p,t} + C_{o,p,t}`
  - `Y_c,t = C_{w,c,t} + C_{o,c,t}`
- Labor market:
  - `L_p,t + L_c,t = L̄`

### Closed-form equilibrium each period
Because firms are competitive and production is linear:
- Total income `Y_t = w_t L̄ + R_t`.
- Expenditure on proprietary good is the weighted sum of household shares:
  - `S_p,t = θ_w (w_t L̄) + θ_o (1-s_R) R_t`.
- Expenditure on commons good:
  - `S_c,t = (1-θ_w) (w_t L̄) + (1-θ_o) (1-s_R) R_t`.
- Goods market clearing implies `p_s,t Y_s,t = S_s,t` for each sector. But
  `p_s,t Y_s,t = (w_t/A_s,t) (A_s,t L_s,t) = w_t L_s,t`, therefore:
  - `L_p,t = S_p,t / w_t`
  - `L_c,t = S_c,t / w_t`
- Labor market clearing gives `w_t`:
  - `L̄ = (S_p,t + S_c,t) / w_t = (w_t L̄ + (1-s_R) R_t) / w_t`
  - `w_t = (w_t L̄ + (1-s_R) R_t) / L̄`
  - Solve: `w_t = R_t / (s_R L̄)` if `s_R>0`.
  - In practice we use the identity `w_t = (w_t L̄ + (1-s_R) R_t)/L̄` directly in
    simulation (numerically stable even when `s_R` is small).

This is a minimal, transparent structure: linear tech + Cobb-Douglas demand
eliminates numerical root-finding. Prices and outputs are pinned down by `A_p,t`,
`A_c,t`, and the income split between wages and licensing.

## 3) Ideas, diffusion, and policy channels

### Knowledge accumulation
- Proprietary ideas (created by owners’ R&D):
  - `K_p,t+1 = (1-δ) K_p,t + η I_t`
- Commons ideas (learning-by-doing plus spillovers):
  - `K_c,t+1 = (1-δ) K_c,t + χ Y_c,t + λ K_p,t`

### Channels
- Higher `K_p,t` raises `A_p,t` directly, and raises `A_c,t` indirectly through
  `λ K_p,t`.
- Higher openness `λ`:
  1) boosts commons productivity (`A_c,t`),
  2) increases licensing income (`R_t = ρ λ K_p,t`),
  3) may raise owners’ R&D via `I_t = s_R R_t`.

Thus the model has a simple but meaningful IP dynamic: openness affects both the
private return to ideas (licensing) and the social diffusion of ideas.

## 4) Plain-language interpretation + limitations

### Interpretation
- There are two sectors producing different goods using labor and knowledge.
- Owners invest in R&D to grow proprietary ideas. Those ideas make the
  proprietary sector more productive, but can also spill into the commons
  depending on openness.
- Openness policy (`λ`) creates a trade-off: more diffusion raises commons
  productivity and output; licensing channels can still reward owners, supporting
  R&D in the proprietary sector.

### Limitations (intentional simplifications)
- No capital, no intertemporal optimization, and no strategic pricing.
- Linear production implies zero profits and removes endogenous markups.
- Licensing income is modeled as a reduced-form function of ideas and openness.
- Household labor supply is inelastic and owners do not work.

These simplifications keep the GE core transparent while still capturing key
open-source/IP dynamics: innovation incentives, diffusion, and sectoral
productivity differences.
