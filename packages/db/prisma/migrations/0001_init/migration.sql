-- SQLite migration (D1 compatible)

CREATE TABLE IF NOT EXISTS users (
  id TEXT NOT NULL PRIMARY KEY,
  locale TEXT NOT NULL DEFAULT 'ja-JP',
  timezone TEXT NOT NULL DEFAULT 'Asia/Tokyo',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS couples (
  id TEXT NOT NULL PRIMARY KEY,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS memberships (
  couple_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  left_at TEXT,
  PRIMARY KEY (couple_id, user_id),
  FOREIGN KEY (couple_id) REFERENCES couples(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_membership_active_two
ON memberships(couple_id, role)
WHERE left_at IS NULL;

CREATE TABLE IF NOT EXISTS invite_codes (
  code TEXT NOT NULL PRIMARY KEY,
  couple_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  FOREIGN KEY (couple_id) REFERENCES couples(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS rules (
  id TEXT NOT NULL PRIMARY KEY,
  couple_id TEXT NOT NULL,
  title TEXT NOT NULL,
  objective TEXT,
  mode TEXT NOT NULL DEFAULT 'routine',
  point_value INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  thank_you_threshold INTEGER NOT NULL DEFAULT 5,
  nobishiro_threshold INTEGER NOT NULL DEFAULT 3,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at TEXT,
  FOREIGN KEY (couple_id) REFERENCES couples(id)
);

CREATE TABLE IF NOT EXISTS rule_events (
  id TEXT NOT NULL PRIMARY KEY,
  rule_id TEXT NOT NULL,
  couple_id TEXT NOT NULL,
  reporter_user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  report_type TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  rejected_by TEXT,
  rejected_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (rule_id) REFERENCES rules(id),
  FOREIGN KEY (couple_id) REFERENCES couples(id),
  FOREIGN KEY (reporter_user_id) REFERENCES users(id),
  FOREIGN KEY (target_user_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (rejected_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS point_ledger (
  id TEXT NOT NULL PRIMARY KEY,
  couple_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  points INTEGER NOT NULL,
  point_kind TEXT,
  week_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (couple_id) REFERENCES couples(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (source_event_id) REFERENCES rule_events(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_point_ledger_unique_event
ON point_ledger(source_event_id);

CREATE TABLE IF NOT EXISTS repair_templates (
  id TEXT NOT NULL PRIMARY KEY,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS repair_actions (
  id TEXT NOT NULL PRIMARY KEY,
  couple_id TEXT NOT NULL,
  trigger_event_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  assignee_user_id TEXT NOT NULL,
  due_at TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (couple_id) REFERENCES couples(id),
  FOREIGN KEY (trigger_event_id) REFERENCES rule_events(id),
  FOREIGN KEY (template_id) REFERENCES repair_templates(id),
  FOREIGN KEY (assignee_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS safety_actions (
  id TEXT NOT NULL PRIMARY KEY,
  couple_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (couple_id) REFERENCES couples(id),
  FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT NOT NULL PRIMARY KEY,
  user_id TEXT,
  couple_id TEXT,
  event_name TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (couple_id) REFERENCES couples(id)
);
