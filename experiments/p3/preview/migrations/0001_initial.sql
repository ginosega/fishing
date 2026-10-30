-- FISH118 P3 isolated sandbox. Never apply to production or AUTH-P0 D1.
-- Durable schema for future approved trusted operation coordinator.
CREATE TABLE IF NOT EXISTS p3_sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  github_id INTEGER NOT NULL,
  csrf_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS p3_sessions_owner_expiry ON p3_sessions(github_id,expires_at);

CREATE TABLE IF NOT EXISTS p3_operations (
  operation_id TEXT PRIMARY KEY NOT NULL,
  github_id INTEGER NOT NULL,
  repo_id INTEGER NOT NULL,
  idempotency_key_hash TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('Accepted','Validating','Checking','Merging','Deploying','Verifying','Live','Conflict','Failed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  lease_owner TEXT,
  lease_expires_at INTEGER,
  pr_number INTEGER,
  pr_head_sha TEXT,
  main_base_sha TEXT,
  merge_sha TEXT,
  workflow_run_id INTEGER,
  verified_release_id TEXT,
  reason_code TEXT,
  UNIQUE(github_id,repo_id,idempotency_key_hash)
);
CREATE INDEX IF NOT EXISTS p3_operations_state_lease ON p3_operations(state,lease_expires_at);

CREATE TABLE IF NOT EXISTS p3_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL REFERENCES p3_operations(operation_id),
  event_type TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT,
  event_at INTEGER NOT NULL,
  error_code TEXT,
  details_digest TEXT
);
CREATE INDEX IF NOT EXISTS p3_events_operation ON p3_events(operation_id,event_at);
