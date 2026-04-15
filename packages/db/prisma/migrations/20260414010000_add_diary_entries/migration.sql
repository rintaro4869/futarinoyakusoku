CREATE TABLE "diary_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "couple_id" TEXT NOT NULL,
    "author_user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "diary_entries_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "couples" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "diary_entries_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
