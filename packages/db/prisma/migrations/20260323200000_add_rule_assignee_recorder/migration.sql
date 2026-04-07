-- AlterTable
ALTER TABLE "rules" ADD COLUMN "creator_user_id" TEXT;
ALTER TABLE "rules" ADD COLUMN "assignee" TEXT NOT NULL DEFAULT 'both';
ALTER TABLE "rules" ADD COLUMN "recorder" TEXT NOT NULL DEFAULT 'self';
