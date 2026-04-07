/*
  Warnings:

  - You are about to alter the column `completed_at` on the `repair_actions` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `created_at` on the `repair_actions` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `due_at` on the `repair_actions` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_repair_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "couple_id" TEXT NOT NULL,
    "trigger_event_id" TEXT,
    "template_id" TEXT NOT NULL,
    "assignee_user_id" TEXT NOT NULL,
    "due_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'open',
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "repair_actions_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "repair_actions_trigger_event_id_fkey" FOREIGN KEY ("trigger_event_id") REFERENCES "rule_events" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "repair_actions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "repair_templates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "repair_actions_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_repair_actions" ("assignee_user_id", "completed_at", "couple_id", "created_at", "due_at", "id", "status", "template_id", "trigger_event_id") SELECT "assignee_user_id", "completed_at", "couple_id", "created_at", "due_at", "id", "status", "template_id", "trigger_event_id" FROM "repair_actions";
DROP TABLE "repair_actions";
ALTER TABLE "new_repair_actions" RENAME TO "repair_actions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
