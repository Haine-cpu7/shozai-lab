# v1.69 BOT-only ethics lab audit

## No.016 無意味なラベル
- 300組の同一BOTを赤/青へ複製。
- ability / adaptability / discipline / initial health / initial cash / initial skill / annual shock draws are paired.
- Default treatment: red-only access multiplier -20% for hiring, education, productive credit.
- No direct wage penalty or direct ability penalty.
- Placebo (all penalties 0) produces exact paired outcome equality under fixed seed.
- 15-year removal scenario tests persistence after treatment removal.

Baseline seed 20261006:
- median paired net-worth gap (blue - red): about ¥1.07m
- blue pair wins: 293 / 300
- median skill: red 0.718 / blue 0.800
- employment: red 97.7% / blue 98.7%
- remove-at-15 gap narrows to about ¥0.69m
- placebo paired gap: ¥0

## No.017 報われない努力
- 300組の同一BOTを fair / blocked-reward worldsへ複製。
- Same intrinsic traits and yearly noise.
- Default blocked world: successful-reward probability reduced 70%; failure penalty multiplier 1.7.
- Effort itself is not directly lowered. BOT updates expected return from observed reward history, and effort/challenge respond to that expectation.
- Placebo (reward block 0, penalty multiplier 1) produces exact paired equality.
- Restore-at-15 scenario tests recovery after rule normalization.

Baseline seed 20261006:
- reward expectation: fair 0.471 / blocked 0.226
- effort: fair 0.840 / blocked 0.762
- median challenges: fair 16 / blocked 15
- median skill: fair 1.175 / blocked 1.120
- median income: fair ~¥5.81m / blocked ~¥4.29m
- restore-at-15: expectation mostly recovers, but skill/income history gap remains.

## QA
- Both engines pass selfCheck and fixed-seed reproducibility.
- HTML duplicate IDs: none.
- Local links: no missing targets.
- Inline JS syntax: passes node --check (JSON-LD excluded as JSON).
- Placebo checks confirm no hidden red/blue or fair/blocked asymmetry.
