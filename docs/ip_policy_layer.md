# IP/Open-Source Policy Layer

This document defines an IP/open-source policy layer as a set of composable levers that map directly into model equations. The levers can be combined into policy packages (presets) to create consistent, repeatable scenarios.

## A) Lever-to-equation mapping (table-like list)

| Lever | Setting/Proxy | What it changes in the equations (model mapping) | Channels affected |
| --- | --- | --- | --- |
| Patent strength | Duration/breadth proxy (0–1) | Increases effective monopoly duration and markup factor (e.g., `markup = base_markup * (1 + patent_strength * markup_premium)`), delays entry via higher fixed IP barrier (`entry_cost += patent_strength * barrier_cost`). | Profits/markups, diffusion cost, innovation incentives |
| Enforcement intensity | Litigation/penalty proxy (0–1) | Raises expected penalty for infringement (`expected_penalty = enforcement * infringement_rate * penalty_scale`), boosts incumbent profits by deterring entry, and shifts bargaining power against labor (if profits are shared via bargaining). | Profits/markups, diffusion cost, distribution (wages vs profits) |
| Compulsory licensing rule | On/off + royalty cap (cap in % of price) | If on, reduces monopoly power by capping licensing fees (`royalty_rate = min(market_rate, cap)`), increases effective diffusion rate through easier access (`diffusion_speed += licensing_on * diffusion_boost`). | Profits/markups, diffusion speed, innovation incentives |
| Open-source adoption incentives | Subsidy / procurement preference | Lowers adoption cost for open tech (`adoption_cost -= os_subsidy`), increases market share weight for open vendors (`demand_share += procurement_preference`). | Diffusion speed/cost, distribution (wages vs profits via broader adoption) |
| Copyleft strength | Strength 0–1 (derivatives must remain open) | Raises openness persistence (`open_share_next = open_share + copyleft_strength * derivative_open_rate`), but can lower private capture of returns (`private_return -= copyleft_strength * capture_penalty`). | Innovation incentives, diffusion speed, profits/markups |
| Interoperability/standard mandate | Strength 0–1 | Lowers switching costs (`switching_cost *= (1 - standard_mandate)`), accelerates diffusion (`diffusion_speed += standard_mandate * diffusion_boost`). | Diffusion speed/cost, profits/markups |
| Public R&D funding share | % allocated to commons vs proprietary | Splits innovation funding (`rd_commons = rd_total * commons_share`), raises open innovation supply (`open_innovation += rd_commons * rd_efficiency`), lowers private returns on proprietary path. | Innovation incentives, diffusion speed, distribution |
| Data/knowledge governance | Commons openness vs enclosure risk (0–1) | Sets access friction for data/knowledge (`data_access_cost *= (1 - openness)`), shifts learning spillovers (`spillover_rate += openness * spillover_boost`). | Innovation incentives, diffusion speed/cost, distribution |

## B) Default policy presets (packages of lever values)

Each preset can be represented as a vector of lever settings. Values are illustrative (0–1 unless otherwise stated).

1. **Strong IP**
   - Patent strength: 0.9
   - Enforcement intensity: 0.9
   - Compulsory licensing: off (cap n/a)
   - Open-source incentives: low (0.1)
   - Copyleft strength: 0.1
   - Interoperability mandate: 0.1
   - Public R&D commons share: 0.1
   - Data/knowledge openness: 0.2

2. **Weak IP**
   - Patent strength: 0.2
   - Enforcement intensity: 0.2
   - Compulsory licensing: on (cap 0.05)
   - Open-source incentives: 0.6
   - Copyleft strength: 0.3
   - Interoperability mandate: 0.6
   - Public R&D commons share: 0.6
   - Data/knowledge openness: 0.6

3. **Balanced**
   - Patent strength: 0.5
   - Enforcement intensity: 0.5
   - Compulsory licensing: on (cap 0.08)
   - Open-source incentives: 0.4
   - Copyleft strength: 0.4
   - Interoperability mandate: 0.5
   - Public R&D commons share: 0.4
   - Data/knowledge openness: 0.5

4. **Strong copyleft commons**
   - Patent strength: 0.3
   - Enforcement intensity: 0.3
   - Compulsory licensing: on (cap 0.04)
   - Open-source incentives: 0.7
   - Copyleft strength: 0.9
   - Interoperability mandate: 0.7
   - Public R&D commons share: 0.7
   - Data/knowledge openness: 0.8

5. **Permissive open source**
   - Patent strength: 0.4
   - Enforcement intensity: 0.3
   - Compulsory licensing: on (cap 0.06)
   - Open-source incentives: 0.8
   - Copyleft strength: 0.2
   - Interoperability mandate: 0.8
   - Public R&D commons share: 0.6
   - Data/knowledge openness: 0.8

6. **Compulsory licensing + public R&D**
   - Patent strength: 0.4
   - Enforcement intensity: 0.4
   - Compulsory licensing: on (cap 0.03)
   - Open-source incentives: 0.5
   - Copyleft strength: 0.4
   - Interoperability mandate: 0.6
   - Public R&D commons share: 0.8
   - Data/knowledge openness: 0.7

## C) Expected qualitative outcomes and chart cues

1. **Strong IP**
   - Expected outcomes: Higher markups/profits, slower diffusion, higher private R&D, lower wage share if bargaining tied to market power.
   - Chart cues: Rising profit share, muted adoption curves, higher price indices, innovation spikes but uneven diffusion.

2. **Weak IP**
   - Expected outcomes: Lower markups, faster diffusion, more spillovers, modest private R&D but stronger cumulative innovation via access.
   - Chart cues: Faster adoption, lower prices, higher wage share, more even distribution of gains.

3. **Balanced**
   - Expected outcomes: Moderate markups, steady diffusion, mixed innovation incentives, stable distribution.
   - Chart cues: Smooth adoption with mid-level prices, balanced profit/wage shares, stable innovation rates.

4. **Strong copyleft commons**
   - Expected outcomes: High openness, rapid diffusion, strong commons growth, potentially lower private capture but strong learning spillovers.
   - Chart cues: Open share rising quickly, prices falling, innovation sustained through spillovers, wage share improving.

5. **Permissive open source**
   - Expected outcomes: Fast diffusion via low friction, strong ecosystem entry, moderate private incentives, higher variety/competition.
   - Chart cues: Rapid diffusion with competitive pricing, higher entry rates, moderate profit margins, broad wage gains.

6. **Compulsory licensing + public R&D**
   - Expected outcomes: Lower monopoly rents, high diffusion, strong public innovation supply, balanced private incentives due to licensing revenue.
   - Chart cues: Higher adoption and knowledge stock, stable prices, increased innovation from public pipeline, flatter profit share.
