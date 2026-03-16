-- Migration 0002: point_kind + rule mode columns
-- Non-breaking: all new columns are nullable or have defaults

-- rules: add mode and split thresholds
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS mode               VARCHAR(20) NOT NULL DEFAULT 'routine',
  ADD COLUMN IF NOT EXISTS thank_you_threshold INT         NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS nobishiro_threshold INT         NOT NULL DEFAULT 3;

-- point_ledger: add point_kind
ALTER TABLE point_ledger
  ADD COLUMN IF NOT EXISTS point_kind VARCHAR(20) NULL;

-- Backfill rules mode from objective JSON meta where present
-- Format: [FNY_META:m=adhoc,...] → set mode = 'adhoc'
UPDATE rules
SET mode = 'adhoc'
WHERE objective LIKE '%[FNY_META:%m=adhoc%';
