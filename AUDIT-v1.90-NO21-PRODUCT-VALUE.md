# AUDIT v1.90 — No.21 商品価値と商売成立

- Source: v1.89
- Added: `product-value.html`, `product-value-research.html`, `product-value-engine.js`
- Question: 中身が価格分の成果を生まなくても、商売は成立する？
- Split metrics: seller profit / buyer direct monetary ROI / buyer total received value / refund / reputation
- Four offers: 情報だけ / 実用付加 / 訴求付加 / 実用＋訴求
- Same 6 buyer-value profiles as No.20
- Default direct information value ¥2,500 is a toy assumption, not imported from No.01
- Added No.01 ↔ No.20 ↔ No.21 navigation
- Updated index count, ItemList JSON-LD, sitemap and README
- Simulation engine selfCheck required before release

## QA results
- Engine `selfCheck()`: PASS
- Same Seed reproducibility: PASS
- Different Seed can differ: PASS
- Finite/bounds: PASS
- Inline JS syntax (`node --check`): PASS
- JSON-LD parse: PASS
- Local link audit: 0 missing
- Duplicate IDs on No.21 pages: 0
- Sitemap: No.21 simulation + research included

## Baseline toy result (Seed 20261008 / price ¥7,980 / direct information value ¥2,500)
- 情報だけ: purchase 9.5%, refund 9.5%, seller profit +¥2,399,980, buyer total surplus median -¥5,457, final reputation 29.5%
- 実用付加: purchase 45.5%, refund 11.0%, seller profit +¥11,200,820, buyer total surplus median +¥1,023, final reputation 69.9%
- 訴求付加: purchase 26.3%, refund 23.6%, seller profit +¥5,728,496, buyer total surplus median -¥5,247, final reputation 28.4%
- 実用＋訴求: purchase 69.6%, refund 12.5%, seller profit +¥16,623,700, buyer total surplus median -¥673, final reputation 65.6%

These are model outputs, not market estimates.
