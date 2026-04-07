DROP INDEX IF EXISTS "ux_point_ledger_unique_event";
DROP INDEX IF EXISTS "point_ledger_source_event_id_key";

CREATE UNIQUE INDEX IF NOT EXISTS "point_ledger_source_event_id_user_id_key"
  ON "point_ledger"("source_event_id", "user_id");
