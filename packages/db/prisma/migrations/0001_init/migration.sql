create table users (
  id text primary key,
  locale text not null default 'ja-JP',
  timezone text not null default 'Asia/Tokyo',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table couples (
  id text primary key,
  status text not null check (status in ('pending','active','paused','closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table memberships (
  couple_id text not null references couples(id),
  user_id text not null references users(id),
  display_name text not null,
  role text not null check (role in ('owner','partner')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (couple_id, user_id)
);

create unique index ux_membership_active_two
on memberships(couple_id, role)
where left_at is null;

create table invite_codes (
  code text primary key,
  couple_id text not null references couples(id),
  created_by text not null references users(id),
  expires_at timestamptz not null,
  used_at timestamptz
);

create table rules (
  id text primary key,
  couple_id text not null references couples(id),
  title text not null,
  objective text,
  point_value int not null check (point_value between 1 and 5),
  threshold int not null check (threshold between 3 and 20),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table rule_events (
  id text primary key,
  rule_id text not null references rules(id),
  couple_id text not null references couples(id),
  reporter_user_id text not null references users(id),
  target_user_id text not null references users(id),
  report_type text not null check (report_type in ('self','partner')),
  note text,
  status text not null check (status in ('pending','approved','rejected','expired')),
  expires_at timestamptz not null,
  approved_by text references users(id),
  approved_at timestamptz,
  rejected_by text references users(id),
  rejected_at timestamptz,
  created_at timestamptz not null default now()
);

create table point_ledger (
  id text primary key,
  couple_id text not null references couples(id),
  user_id text not null references users(id),
  source_event_id text not null references rule_events(id),
  points int not null check (points > 0),
  week_key text not null,
  created_at timestamptz not null default now()
);

create unique index ux_point_ledger_unique_event
on point_ledger(source_event_id);

create table repair_templates (
  id text primary key,
  category text not null,
  label text not null,
  description text not null,
  active boolean not null default true
);

create table repair_actions (
  id text primary key,
  couple_id text not null references couples(id),
  trigger_event_id text not null references rule_events(id),
  template_id text not null references repair_templates(id),
  assignee_user_id text not null references users(id),
  due_at timestamptz,
  status text not null check (status in ('open','completed','skipped','expired')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table safety_actions (
  id text primary key,
  couple_id text not null references couples(id),
  actor_user_id text not null references users(id),
  action_type text not null check (action_type in ('pause','unpause','leave','help_click')),
  reason text,
  created_at timestamptz not null default now()
);

create table analytics_events (
  id bigserial primary key,
  user_id text references users(id),
  couple_id text references couples(id),
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
