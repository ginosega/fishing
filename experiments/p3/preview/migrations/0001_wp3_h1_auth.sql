-- WP3 H1: identical AUTH-P0 schema from immutable historical draft #262.
-- SOURCE ONLY. Execute only against NEW isolated DB fishing-v3-wp3-auth-test
-- after confirming an empty database and the approved target identity.
-- This file is NOT an automatic migration and does not grant GitHub writes.
CREATE TABLE IF NOT EXISTS auth_flows (
  state_hash TEXT PRIMARY KEY NOT NULL,
  code_verifier TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  github_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS auth_flows_expiry ON auth_flows (expires_at);
