# Cloudflare デプロイ手順

## 構成

```
Cloudflare Pages  ← Next.js (web)
Cloudflare Workers ← Hono API (api)
Neon              ← PostgreSQL (DB)
```

---

## 1. Neon（DB）セットアップ

1. https://neon.tech にサインアップ（無料）
2. プロジェクト作成 → `futari-no-yakusoku`
3. リージョン: `AWS ap-northeast-1`（東京）推奨
4. Connection string をコピー:
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. マイグレーション実行:
   ```bash
   DATABASE_URL="<neon接続文字列>" node_modules/.bin/prisma migrate deploy \
     --schema packages/db/prisma/schema.prisma
   ```
6. シードデータ投入:
   ```bash
   DATABASE_URL="<neon接続文字列>" pnpm db:seed
   ```

---

## 2. Cloudflare Workers（API）デプロイ

```bash
cd apps/api

# wrangler ログイン（初回のみ）
npx wrangler login

# Secrets 設定（ダッシュボードには保存されない）
npx wrangler secret put DATABASE_URL
# → neon接続文字列を入力

npx wrangler secret put JWT_SECRET
# → openssl rand -base64 32 で生成した文字列を入力

# デプロイ
npx wrangler deploy --config wrangler.toml
```

デプロイ後のURL例: `https://futari-no-yakusoku-api.<account>.workers.dev`

---

## 3. Cloudflare Pages（Web）デプロイ

### 方法A: GitHub連携（推奨）

1. GitHubリポジトリをpush
2. Cloudflare Pages ダッシュボード → 「Create application」
3. 設定:
   ```
   Framework preset:   Next.js
   Build command:      npx @cloudflare/next-on-pages@1
   Build output dir:   .vercel/output/static
   Root directory:     apps/web
   ```
4. 環境変数を追加:
   ```
   NEXT_PUBLIC_API_URL = https://futari-no-yakusoku-api.<account>.workers.dev/api/v1
   NEXT_PUBLIC_APP_URL = https://futari-no-yakusoku.pages.dev
   CF_PAGES = 1
   ```

### 方法B: CLI

```bash
cd apps/web

# ビルド
npx @cloudflare/next-on-pages@1

# デプロイ
npx wrangler pages deploy .vercel/output/static \
  --project-name futari-no-yakusoku
```

---

## 4. 完了確認

```bash
# API ヘルスチェック
curl https://futari-no-yakusoku-api.<account>.workers.dev/api/v1/health
# → {"ok":true}

# Web アクセス
open https://futari-no-yakusoku.pages.dev
```

---

## 費用試算（無料枠）

| サービス | 無料枠 | 月額目安 |
|---------|-------|---------|
| Cloudflare Workers | 100,000 req/日 | $0 |
| Cloudflare Pages | 500ビルド/月, 無制限帯域 | $0 |
| Neon PostgreSQL | 0.5GB, 190時間/月 | $0 |
| **合計** | | **$0** |

> MVPフェーズでは完全無料で運用可能。ユーザー数が増えた場合の目安: Workers Paid $5/月、Neon Pro $19/月。

---

## トラブルシューティング

### `prisma generate` がWorkers上で失敗する
→ `packages/db/prisma/schema.prisma` の `generator client` に以下を追加:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```
→ `@prisma/adapter-neon` が自動で使われる

### CORS エラー
→ `apps/api/wrangler.toml` の `[vars]` の `WEB_URL` がPagesのURLと一致しているか確認

### JWT 検証失敗
→ WorkerとPagesで同じ `JWT_SECRET` を使っているか確認
