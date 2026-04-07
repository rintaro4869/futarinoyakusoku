ALTER TABLE "rules" ADD COLUMN "recurrence_type" TEXT;
ALTER TABLE "rules" ADD COLUMN "recurrence_interval" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "rules" ADD COLUMN "days_of_week" TEXT;
ALTER TABLE "rules" ADD COLUMN "day_of_month" INTEGER;
ALTER TABLE "rules" ADD COLUMN "time_of_day" TEXT;

CREATE TABLE "rule_occurrence_actions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "rule_id" TEXT NOT NULL,
  "occurrence_date" DATETIME NOT NULL,
  "action_type" TEXT NOT NULL,
  "override_time" TEXT,
  "note" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rule_occurrence_actions_rule_id_fkey"
    FOREIGN KEY ("rule_id") REFERENCES "rules" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "rule_occurrence_actions_rule_id_occurrence_date_key"
  ON "rule_occurrence_actions" ("rule_id", "occurrence_date");
