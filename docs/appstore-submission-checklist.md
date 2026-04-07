# App Store 提出準備チェックリスト

> Apple Developer Program 承認後、このリストを上から順に進めてください。

---

## STEP 1: Apple Developer Program 確認

- [ ] Apple Developer Program が「承認済み」になっている（審査メールが届いた）
- [ ] App Store Connect（appstoreconnect.apple.com）にログインできる

---

## STEP 2: App Store Connect でアプリ登録

- [ ] App Store Connect を開く → 「マイ App」→「＋」→「新規 App」
- [ ] プラットフォーム: iOS を選択
- [ ] 名前（アプリ名）: `Pairlog — ふたりの記録`
- [ ] プライマリ言語: 日本語
- [ ] バンドル ID: `dev.pairlog.app`（ドロップダウンから選択）
- [ ] SKU: `pairlog-v1`（自分で決める管理用コード、何でも OK）

---

## STEP 3: ビルドをアップロード（EAS Build）

- [ ] Apple Developer 承認後、ターミナルで以下を実行:
  ```
  EXPO_TOKEN=<あなたのトークン> npx eas-cli build --platform ios --profile production
  ```
- [ ] ビルドが成功したら、Expo ダッシュボード（expo.dev）でダウンロード可能になる
- [ ] App Store Connect に「Processing」でビルドが届くのを待つ（30分〜1時間）

---

## STEP 4: TestFlight でテスト（必須）

- [ ] `docs/testflight-checklist.md` のリストを実機で一通り確認する
- [ ] 自分でテストして問題なければ提出へ進む

---

## STEP 5: App Store 情報を入力

- [ ] `docs/appstore-text-draft.md` の文言をコピーして App Store Connect に貼る
- [ ] スクリーンショットをアップロード（iPhone 6.5" / 5.5" の 2 種類が最低限必要）
- [ ] プレビュー動画（任意）
- [ ] カテゴリ: ライフスタイル（第 1）/ ソーシャルネットワーキング（第 2）
- [ ] コンテンツ年齢制限: 12+（アプリ内の質問に答えると自動設定される）
- [ ] 価格: 無料

---

## STEP 6: プライバシー設定

- [ ] `docs/privacy-nutrition-label.md` を参照して「App のプライバシー」を入力
- [ ] プライバシーポリシー URL を入力（Notion の公開 URL）

---

## STEP 7: 審査提出

- [ ] 全てのセクションに緑のチェックマークが表示されていることを確認
- [ ] 「審査に提出」をクリック
- [ ] 審査メモ（reviewer note）を `docs/appstore-text-draft.md` からコピーして貼る
- [ ] 提出完了！通常 1〜3 営業日で結果が届く

---

## STEP 8: 審査結果対応

- **承認**: App Store に自動公開される（または手動公開を設定できる）
- **リジェクト**: メールに理由が書かれている。`docs/post-approval-roadmap.md` を参照

---

## スクリーンショット撮影のヒント

スクリーンショットは「TestFlight のビルドが動く実機」で撮ります。

必要なサイズ:
- iPhone 6.5"（iPhone 14 Pro Max / 15 Plus など）: **必須**
- iPhone 5.5"（iPhone 8 Plus など）: **必須**

撮影すべき画面（最低 3 枚、推奨 5 枚）:
1. ホーム画面（ポイントメーター）
2. 記録画面（ルール一覧）
3. 解放画面（ごほうびのタスク）
4. 週次サマリー
5. ペア接続画面（招待コード）
