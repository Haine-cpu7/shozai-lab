# AUDIT v1.75 — No.017 用語整理 / BOT性格差

- No.017 正式タイトル: 「成果を出しても報われない世界で、BOTはどう変わる？」
- 画面上の「努力」は「行動投入」へ整理。`effort` の内部計算式そのものは維持。
- 新規固定特性 `feedback`: 結果・報酬の観測を「次もやる価値」へ反映する更新速度。知能ではない。
- 同一BOTペアで `ability / adapt / drive / feedback / health0 / skill0` は一致。
- `feedback` は報酬獲得確率や成果値を直接変えず、報酬期待 `belief` の更新速度だけに作用。
- 平均的な更新速度は旧固定係数 0.22 に近い範囲を維持し、個体差のみ追加。
- Placebo の paired belief gap / paired skill gap = 0 を selfCheck で確認。
- Seed再現性、ペア特性一致を selfCheck で確認。
