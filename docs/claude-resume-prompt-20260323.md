# Claude Resume Prompt (2026-03-23)

以下をそのまま Claude に渡してください。

```text
既存 Pairlog の続きです。前回途中で止まったので、まず現在のブランチ差分を読み、既存変更を壊さずに引き継いでください。

重要:
- 全面再実装ではなく差分で進めてください
- すでに Codex 側で入っている実装を先に理解してから着手してください
- Pairlog は「家事分担アプリ」ではなく「家庭運営の約束OS」です
- ごほうびタブは必須です
- 浮遊して見える青い歯車は iOS シミュレータ側 UI なので消さなくて大丈夫です
- 相談窓口 UI は不要です
- user-facing 表示は `のびしろポイント` ではなく `約束ポイント` に寄せてください

正本として読むもの:
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/AGENTS.md
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/docs/16_Codex_UIUX_Principles.md
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/docs/17_Pairlog_Design_Principles.md
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/docs/18_Codex_Marketing_Principles.md
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/docs/19_Pairlog_Marketing_Principles.md

Pairlog 側 docs:
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/docs/v1-rebuild-policy.md
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/docs/v1-information-architecture.md
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/docs/v1-screen-responsibilities.md
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/docs/v1-differentiation.md
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/docs/security-basics-checklist.md

まず把握してほしいこと:
1. 現在のブランチには、Codex 側でいくつかの重要変更がすでに入っています
2. それを消さずに、残タスクを続けてください
3. 最初に git diff と主要ファイルを読んで、実装済み / 未完了を整理してください

Codex 側で入れた・補強したポイント:

【ホーム / UI】
- ホームに `ふたり / わたし / パートナー` の3軸表示を追加
- 「ふたりの約束」「ふたりのありがとう」が溜まったらどうなるかを伝えるため、ホームにごほうび進捗の意味づけを追加
- ごほうびが解放できる状態か、次のごほうびまであと何ptか、空状態かを見せるカードを追加
- 必要な日本語 / 英語 i18n キーも追加済み

対象ファイル:
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/mobile/app/(home)/index.tsx
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/mobile/lib/i18n/ja.ts
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/mobile/lib/i18n/en.ts

補足:
- いまのデータモデルには gender を持っていないため、現時点では `女性 / 男性` ではなく `わたし / パートナー` です
- 将来プロフィール属性を入れれば切り替え可能な構造にしてあります

【セキュリティの基本防御】
Codex 側で、API に一般的な基本防御を追加しました。

1. CORS を厳格化
- Pairlog の正しい URL から来たブラウザ通信だけ許可する方向へ変更

2. JWT_SECRET ガード
- 本番 URL 相当なのに秘密鍵が短い / 未設定なら安全側で止まるようにした

3. 認証エンドポイントの簡易レート制限
- login / register / anonymous に対して短時間の連打を少し止めるようにした

4. セキュリティヘッダ
- no-store など、基本的なレスポンスヘッダを追加

5. パスワード照合 hardening
- 壊れた保存形式でも例外で落ちにくくし、比較方法も少し安全寄りに変更

対象ファイル:
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/api/src/app.ts
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/api/src/lib/security.ts
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/api/src/lib/password.ts
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/api/src/lib/error-codes.ts
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/api/src/services/analytics.ts
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/api/src/lib/db.ts
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/api/src/worker.ts
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/api/src/__tests__/security.test.ts
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/docs/security-basics-checklist.md

確認済みコマンド:
- node ~/.npm-global/bin/pnpm --filter @fny/api exec vitest run src/__tests__/security.test.ts src/__tests__/auth.test.ts src/__tests__/safety.test.ts --reporter=basic
- node ~/.npm-global/bin/pnpm --filter @fny/api exec tsc --noEmit

結果:
- API テスト 15 passed
- API 型チェック通過

【レビュー finding について】
以下の review finding が貼られていましたが、現在のファイル内容とズレている可能性があります。

Finding:
- “safety.test.ts が実装本体を検証していない”

ただし、現時点の
- /Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/api/src/__tests__/safety.test.ts
は、少なくとも help-link-clicked route や analytics import を使う実装寄りのテストになっています。

なので:
- この finding をそのまま鵜呑みにせず
- まず現ファイルを読んで、本当に issue が残っているか確認してから判断してください

今の優先残タスク:

P1. UI の本格磨き込み
- CAJICO の分かりやすさを参考にしつつ、Pairlog らしい差別化を強める
- 特に
  - ホームのヒーロー
  - 約束一覧カード
  - カレンダーの「今日 / 今週」の読みやすさ
  - ごほうびタブの魅力
を改善したい

P1. ごほうびのサーバー保存化
- 今のごほうびは local / 既存構造ベースなので、必要ならサーバー保存へ引き上げたい
- ただし、ユーザーが自分で作るごほうびという前提は維持

P1. Outlook風スケジュールUIの本格化
- start_date や recurrence の土台はあるので、さらに「いつ / どの頻度 / 何時」が直感的に分かるUIへ
- Pairlog に必要な最小限に絞って Outlook 的な分かりやすさを目指す

P2. セキュリティの次段階
- パスワードリセット
- メール認証
- より本格的なレート制限（Cloudflare側含む）
- セキュリティ docs の更新

今回やってほしい進め方:
1. まず git diff と上記ファイルを読んで、現状の実装済み / 未完了を整理
2. 7ステップ以内で実装計画を出す
3. その後、優先度の高いものから差分実装
4. 各段階で必ず以下を報告
   - 変更ファイル一覧
   - 実行コマンド
   - テスト結果
   - 残課題
   - 非エンジニア向け説明（何をしたか / なぜ必要か）

完了条件:
- Codex 側の変更を壊していない
- Pairlog の UI / ごほうび / スケジュール体験が一段進む
- セキュリティの基本防御が維持される
- 本当に残る課題と、次にやるべきことが整理される
```

