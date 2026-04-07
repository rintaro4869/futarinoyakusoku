-- SQLite does not support ALTER COLUMN, so we recreate the table
-- with trigger_event_id changed from NOT NULL to nullable

CREATE TABLE "repair_actions_new" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "couple_id" TEXT NOT NULL,
  "trigger_event_id" TEXT,
  "template_id" TEXT NOT NULL,
  "assignee_user_id" TEXT NOT NULL,
  "due_at" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "completed_at" TEXT,
  "created_at" TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY ("couple_id") REFERENCES "couples"("id"),
  FOREIGN KEY ("trigger_event_id") REFERENCES "rule_events"("id"),
  FOREIGN KEY ("template_id") REFERENCES "repair_templates"("id"),
  FOREIGN KEY ("assignee_user_id") REFERENCES "users"("id")
);

INSERT INTO "repair_actions_new"
  SELECT "id", "couple_id", "trigger_event_id", "template_id", "assignee_user_id",
         "due_at", "status", "completed_at", "created_at"
  FROM "repair_actions";

DROP TABLE "repair_actions";

ALTER TABLE "repair_actions_new" RENAME TO "repair_actions";
