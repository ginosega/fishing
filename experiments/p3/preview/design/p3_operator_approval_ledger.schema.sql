-- FISH118 P3-32 — PROPOSED SCHEMA ONLY, NOT A MIGRATION.
-- Do NOT move into migrations/, apply to local/remote existing D1, or bind
-- to an enabled Worker until separately approved and reviewed.
-- Dedicated sandbox repository ID 1430581407 / owner ID 265665562.
CREATE TABLE p3_operator_approvals (
 approval_id TEXT PRIMARY KEY NOT NULL
  CHECK (length(approval_id)=36),
 repository_id INTEGER NOT NULL CHECK(repository_id=1430581407),
 operator_github_id INTEGER NOT NULL CHECK(operator_github_id=265665562),
 run_id INTEGER NOT NULL CHECK(run_id>0),
 run_attempt INTEGER NOT NULL CHECK(run_attempt BETWEEN 1 AND 100),
 workflow_sha TEXT NOT NULL
  CHECK(length(workflow_sha)=40 AND workflow_sha NOT GLOB '*[^0-9a-f]*'),
 idempotency_key TEXT NOT NULL CHECK(length(idempotency_key) BETWEEN 12 AND 96),
 body_sha256 TEXT NOT NULL
  CHECK(length(body_sha256)=64 AND body_sha256 NOT GLOB '*[^0-9a-f]*'),
 approval_sha256 TEXT NOT NULL UNIQUE
  CHECK(length(approval_sha256)=64 AND approval_sha256 NOT GLOB '*[^0-9a-f]*'),
 issued_at_sec INTEGER NOT NULL CHECK(issued_at_sec>0),
 expires_at_sec INTEGER NOT NULL CHECK(expires_at_sec>issued_at_sec
  AND expires_at_sec-issued_at_sec<=300),
 consumed_at_sec INTEGER NOT NULL CHECK(consumed_at_sec>=issued_at_sec
  AND consumed_at_sec<expires_at_sec)
);
-- No automatic purge. Reuse of an old approval ID must remain impossible.
-- Do not save JWTs, App secrets, Access tokens, raw payload or operator keys.
