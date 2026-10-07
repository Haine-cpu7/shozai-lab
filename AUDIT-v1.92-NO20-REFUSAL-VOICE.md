# AUDIT v1.92 - No.20 非購入セリフ改善

## 修正内容
- No.20（information-purchase / information-purchase-research）の非購入セリフ生成を修正。
- 従来は `wants && !affordable` の場合、6タイプすべてでほぼ同じ文面が出ていた。
- `information-purchase-engine.js` にタイプ別の非購入セリフ分岐を追加。

## 追加した切り分け
- 予算不足（budget）
- 支払意思額不足（wtp）
- 無料代替優勢（free）
- 誇張・訴求への警戒（skeptic）
- そもそも欲しいほどではない（noDesire）

## 期待される改善
- 「買わない側の声」がタイプごとに分かれる。
- 同じ非購入でも、
  - 欲しいけど予算不足
  - 気になるけど価格に見合わない
  - 無料で済ませたい
  - 言い方が強くて引く
  - そこまで欲しくない
  の違いが見える。
- No.20 の表示が、価値観タイプ比較の研究としてより妥当になる。

## 変更ファイル
- `information-purchase-engine.js`
