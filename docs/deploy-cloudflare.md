# Pairlog Cloudflare Deploy

## Current production shape

```text
Cloudflare Pages   <- Web
Cloudflare Workers <- Hono API
Cloudflare D1      <- Primary DB
```

`apps/api/wrangler.toml` binds the production D1 database as `pairlog-db`.

## What changed in this session

The API now tolerates an older `rules` table for read paths and event recording, but the full rule feature set still depends on the latest D1 columns being present.

That means:

1. Home / rules / calendar should stop failing with a 500 as soon as the Worker is redeployed.
2. New rule scheduling, assignee/recorder, and reminder fields are only fully usable after the pending D1 SQL migrations are applied.

## Safe deploy order

Always use this order when rule schema changes are involved:

1. Apply the pending D1 SQL migrations in timestamp order.
2. Redeploy the Worker.

Do not reverse the order. A new Worker against an older D1 schema is exactly the mismatch that caused the recent failures.

## Pre-deploy verification

From the repo root:

```bash
pnpm --filter @fny/api exec tsc --noEmit
pnpm --filter @fny/api test
```

## D1 migration apply

This repo keeps the SQL source of truth in `packages/db/prisma/migrations/*/migration.sql`.

From `apps/api`, apply any production migrations that have not yet been run on D1, in chronological order:

```bash
cd apps/api
npx wrangler d1 execute pairlog-db --remote --file ../../packages/db/prisma/migrations/20260319183032_add_reminder_fields/migration.sql
npx wrangler d1 execute pairlog-db --remote --file ../../packages/db/prisma/migrations/20260319190157_nullable_trigger_event_id/migration.sql
npx wrangler d1 execute pairlog-db --remote --file ../../packages/db/prisma/migrations/20260320000000_nullable_trigger_event_id/migration.sql
npx wrangler d1 execute pairlog-db --remote --file ../../packages/db/prisma/migrations/20260322000000_add_email_auth/migration.sql
npx wrangler d1 execute pairlog-db --remote --file ../../packages/db/prisma/migrations/20260322020000_add_rule_category/migration.sql
npx wrangler d1 execute pairlog-db --remote --file ../../packages/db/prisma/migrations/20260322154000_add_rule_start_date/migration.sql
npx wrangler d1 execute pairlog-db --remote --file ../../packages/db/prisma/migrations/20260322193000_add_rule_schedule_structure/migration.sql
npx wrangler d1 execute pairlog-db --remote --file ../../packages/db/prisma/migrations/20260323000000_add_password_reset_tokens/migration.sql
npx wrangler d1 execute pairlog-db --remote --file ../../packages/db/prisma/migrations/20260323200000_add_rule_assignee_recorder/migration.sql
npx wrangler d1 execute pairlog-db --remote --file ../../packages/db/prisma/migrations/20260330182000_add_user_token_version/migration.sql
npx wrangler d1 execute pairlog-db --remote --file ../../packages/db/prisma/migrations/20260331013000_fix_point_ledger_unique_index/migration.sql
```

If production is already partway through that list, skip the migrations that are already reflected in D1 and continue from the first missing one.

At minimum, the recent rule-related mismatch can involve these files:

- `20260319183032_add_reminder_fields`
- `20260322020000_add_rule_category`
- `20260322154000_add_rule_start_date`
- `20260322193000_add_rule_schedule_structure`
- `20260323200000_add_rule_assignee_recorder`
- `20260330182000_add_user_token_version`
- `20260331013000_fix_point_ledger_unique_index`

## Worker deploy

After D1 is updated:

```bash
pnpm --filter @fny/api deploy
```

Equivalent direct command:

```bash
cd apps/api
npx wrangler deploy
```

## When deploy is enough

Worker redeploy only is enough when:

- the fix is API logic only
- D1 already has every required column

This session's compatibility patch is in that category for read stability. It reduces 500s even before D1 is updated.

## When D1 is still required

D1 migration apply is still required when you want the latest rule fields to persist correctly:

- `start_date`
- `category`
- `creator_user_id`
- `assignee`
- `recorder`
- `recurrence_type`
- `recurrence_interval`
- `days_of_week`
- `day_of_month`
- `time_of_day`
- `reminder_enabled`
- `reminder_time`

Without those columns, the API now fails safely instead of crashing, but the latest rule configuration cannot be fully saved.

## Post-deploy checks

1. Open the home screen and confirm the red error card is gone.
2. Open promises and calendar and confirm the list loads.
3. Tap a rule record action once and confirm it no longer fails with a server error.
4. Create or edit a rule that uses schedule/reminder/assignee fields only after D1 migrations are confirmed applied.
