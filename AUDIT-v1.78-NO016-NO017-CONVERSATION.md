# 商材実験室 v1.78 監査メモ

## 変更対象
- `label-bias.html`
- `label-bias-research.html`
- `unrewarded.html`
- `unrewarded-research.html`
- `README.md`

## 追加内容
1. No.016 / No.017 共通の観察メモ
   - 「結果が違う」ことと「中身が違う」ことを分離。
   - 同一BOTコピーという実験設計上、結果差を開始時の本人差へ直接帰属できないことを明記。
2. LAB CONVERSATION
   - 「公平は自然にあるものか？」
   - 「投入量と報酬量を一致させる宇宙の精算機はない」
   - 神や宗教の真偽を検証するものではなく、研究結果・仮説判定から分離した会話ネタとして表示。

## 非変更
- No.016 / No.017 のエンジンJS
- Seed挙動
- 効果量判定
- BOT traits / 行動更新式
- Placebo / 感度分析 / Robustness

## 意図
モデルが示す「環境差・履歴差」と、現実の個人評価を混同しないための読み方を追加する。
