はてな日和｜SEO更新パッチ（2026-10-12）

【目的】
現在の「はてな日和 〜もしもの箱庭〜」に、検索結果と共有カードの設定を合わせる。
2000年代の個人ホムペらしい見た目や本文、日記のミステリー演出は一切変更しない。

【アップロード】
ZIPの中のHTMLと sitemap.xml をGitHubの shozai-lab リポジトリ直下へ同名で上書き。
READMEはアップロード不要。

【修正したファイル】
index.html                 玄関のタイトル・説明・SNSカード・WebSite構造化データ
about.html                 管理人・NのABOUT ME説明・共有カード・ProfilePage構造化データ
contents.html              BOT実験とゲーム紹介・共有カード（旧研究室画像から変更）
dareka-diary.html          検索説明・共有カード・CreativeWork構造化データ（ネタバレなし）
history.html               更新履歴の検索説明・共有カード
links.html                 LINKの検索説明・共有カード
hatenyan.html              はてにゃんの検索説明・共有カード
real.html                  工事中のため noindex,follow
construction.html          工事中のため noindex,follow
diary.html                 今の玄関から使っていない旧・空の日記帳のため noindex,follow
sitemap.xml                現在の玄関・作品・実験・案内ページを網羅し、空の工事中ページを除外

【守ったこと】
- DIARYの47日分、日付送り、過去ログの修正、2006年の仕掛けは不変更
- HOMEのCONTENTSリンクは contents.html#entrance-contents のまま
- HOMEのお茶代ボタンとOFUSEへのリンクはそのまま
- 管理人のABOUT MEとnoteのリンクを維持
- 実験24個・ゲーム2個・各種JSエンジンや本文は不変更
- robots.txtはもともとクロール許可＋サイトマップ指定が正しく、変更不要
- 元のOG画像og-card-home.pngを使用。画像を再アップロードする必要なし

【注意】
SEO設定は検索順位や掲載を保証しません。サイトマップ再取得や検索結果への反映には時間がかかります。
公開後、Google Search Consoleでサイトマップを再送信して確認できます。
GitHubの最新版が変わっていたら、上書き前に最新との差分を確認してください。
