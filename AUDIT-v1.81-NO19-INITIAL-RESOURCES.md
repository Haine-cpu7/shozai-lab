# AUDIT v1.81 — No.19 初期資源の差

Date: 2026-10-07

## Scope
- Added `resource-engine.js`
- Added `resource.html`
- Added `resource-research.html`
- Added No.19 to `index.html`, `README.md`, `sitemap.xml`

## Experimental design
- 300 matched BOT pairs, 30 years.
- Paired BOT traits are identical: ability, adaptability, discipline, risk tolerance, initial health, initial skill.
- Only resource conditions differ.
- Low-resource condition applies for years 1–5 only; from year 6 access conditions are equalized.
- Resource dimensions: starting cash, learning access, time margin, information access, recovery cushion.
- Sensitivity: 0 / 20 / 40 / 60%.
- Decomposition: each resource dimension isolated one at a time.
- Paired random shocks use the same Seed / BOT id / year draws.

## Guardrails
- Do not call this a poverty simulation.
- Do not infer real-world poverty effect sizes from the model.
- Do not encode lower ability or personality into low-resource BOTs.
- Do not force a large result; report small / null results as such.

## QA
- `resource-engine.js` syntax checked with Node.
- Inline JavaScript in both No.19 pages syntax checked with Node.
- Engine `selfCheck()` passes Seed reproducibility, placebo paired-gap, pair count, and trait identity checks.
- Local href targets checked after full-site update.
