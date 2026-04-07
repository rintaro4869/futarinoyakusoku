/*
  Warnings:

  - You are about to alter the column `created_at` on the `analytics_events` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `closed_at` on the `couples` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `created_at` on the `couples` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `expires_at` on the `invite_codes` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `used_at` on the `invite_codes` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `joined_at` on the `memberships` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `left_at` on the `memberships` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `created_at` on the `point_ledger` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `completed_at` on the `repair_actions` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `created_at` on the `repair_actions` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `due_at` on the `repair_actions` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `active` on the `repair_templates` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - You are about to alter the column `approved_at` on the `rule_events` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `created_at` on the `rule_events` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `expires_at` on the `rule_events` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `rejected_at` on the `rule_events` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `active` on the `rules` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - You are about to alter the column `archived_at` on the `rules` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `created_at` on the `rules` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `created_at` on the `safety_actions` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `created_at` on the `users` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `deleted_at` on the `users` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_analytics_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "couple_id" TEXT,
    "event_name" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "analytics_events_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_analytics_events" ("couple_id", "created_at", "event_name", "id", "payload", "user_id") SELECT "couple_id", "created_at", "event_name", "id", "payload", "user_id" FROM "analytics_events";
DROP TABLE "analytics_events";
ALTER TABLE "new_analytics_events" RENAME TO "analytics_events";
CREATE TABLE "new_couples" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" DATETIME
);
INSERT INTO "new_couples" ("closed_at", "created_at", "id", "status") SELECT "closed_at", "created_at", "id", "status" FROM "couples";
DROP TABLE "couples";
ALTER TABLE "new_couples" RENAME TO "couples";
CREATE TABLE "new_invite_codes" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "couple_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "used_at" DATETIME,
    CONSTRAINT "invite_codes_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invite_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_invite_codes" ("code", "couple_id", "created_by", "expires_at", "used_at") SELECT "code", "couple_id", "created_by", "expires_at", "used_at" FROM "invite_codes";
DROP TABLE "invite_codes";
ALTER TABLE "new_invite_codes" RENAME TO "invite_codes";
CREATE TABLE "new_memberships" (
    "couple_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" DATETIME,

    PRIMARY KEY ("couple_id", "user_id"),
    CONSTRAINT "memberships_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_memberships" ("couple_id", "display_name", "joined_at", "left_at", "role", "user_id") SELECT "couple_id", "display_name", "joined_at", "left_at", "role", "user_id" FROM "memberships";
DROP TABLE "memberships";
ALTER TABLE "new_memberships" RENAME TO "memberships";
CREATE TABLE "new_point_ledger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "couple_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_event_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "point_kind" TEXT,
    "week_key" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "point_ledger_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "point_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "point_ledger_source_event_id_fkey" FOREIGN KEY ("source_event_id") REFERENCES "rule_events" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_point_ledger" ("couple_id", "created_at", "id", "point_kind", "points", "source_event_id", "user_id", "week_key") SELECT "couple_id", "created_at", "id", "point_kind", "points", "source_event_id", "user_id", "week_key" FROM "point_ledger";
DROP TABLE "point_ledger";
ALTER TABLE "new_point_ledger" RENAME TO "point_ledger";
CREATE UNIQUE INDEX "point_ledger_source_event_id_key" ON "point_ledger"("source_event_id");
CREATE TABLE "new_repair_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "couple_id" TEXT NOT NULL,
    "trigger_event_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "assignee_user_id" TEXT NOT NULL,
    "due_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'open',
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "repair_actions_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "repair_actions_trigger_event_id_fkey" FOREIGN KEY ("trigger_event_id") REFERENCES "rule_events" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "repair_actions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "repair_templates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "repair_actions_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_repair_actions" ("assignee_user_id", "completed_at", "couple_id", "created_at", "due_at", "id", "status", "template_id", "trigger_event_id") SELECT "assignee_user_id", "completed_at", "couple_id", "created_at", "due_at", "id", "status", "template_id", "trigger_event_id" FROM "repair_actions";
DROP TABLE "repair_actions";
ALTER TABLE "new_repair_actions" RENAME TO "repair_actions";
CREATE TABLE "new_repair_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_repair_templates" ("active", "category", "description", "id", "label") SELECT "active", "category", "description", "id", "label" FROM "repair_templates";
DROP TABLE "repair_templates";
ALTER TABLE "new_repair_templates" RENAME TO "repair_templates";
CREATE TABLE "new_rule_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rule_id" TEXT NOT NULL,
    "couple_id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" DATETIME NOT NULL,
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "rejected_by" TEXT,
    "rejected_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rule_events_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rules" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rule_events_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rule_events_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rule_events_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rule_events_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rule_events_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_rule_events" ("approved_at", "approved_by", "couple_id", "created_at", "expires_at", "id", "note", "rejected_at", "rejected_by", "report_type", "reporter_user_id", "rule_id", "status", "target_user_id") SELECT "approved_at", "approved_by", "couple_id", "created_at", "expires_at", "id", "note", "rejected_at", "rejected_by", "report_type", "reporter_user_id", "rule_id", "status", "target_user_id" FROM "rule_events";
DROP TABLE "rule_events";
ALTER TABLE "new_rule_events" RENAME TO "rule_events";
CREATE TABLE "new_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "couple_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'routine',
    "point_value" INTEGER NOT NULL,
    "threshold" INTEGER NOT NULL,
    "thank_you_threshold" INTEGER NOT NULL DEFAULT 5,
    "nobishiro_threshold" INTEGER NOT NULL DEFAULT 3,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "reminder_enabled" BOOLEAN NOT NULL DEFAULT false,
    "reminder_time" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" DATETIME,
    CONSTRAINT "rules_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_rules" ("active", "archived_at", "couple_id", "created_at", "id", "mode", "nobishiro_threshold", "objective", "point_value", "thank_you_threshold", "threshold", "title") SELECT "active", "archived_at", "couple_id", "created_at", "id", "mode", "nobishiro_threshold", "objective", "point_value", "thank_you_threshold", "threshold", "title" FROM "rules";
DROP TABLE "rules";
ALTER TABLE "new_rules" RENAME TO "rules";
CREATE TABLE "new_safety_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "couple_id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "safety_actions_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "safety_actions_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_safety_actions" ("action_type", "actor_user_id", "couple_id", "created_at", "id", "reason") SELECT "action_type", "actor_user_id", "couple_id", "created_at", "id", "reason" FROM "safety_actions";
DROP TABLE "safety_actions";
ALTER TABLE "new_safety_actions" RENAME TO "safety_actions";
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locale" TEXT NOT NULL DEFAULT 'ja-JP',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME
);
INSERT INTO "new_users" ("created_at", "deleted_at", "id", "locale", "timezone") SELECT "created_at", "deleted_at", "id", "locale", "timezone" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
