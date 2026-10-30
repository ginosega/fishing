-- FISH118 P3-33. PROPOSED SCHEMA ONLY, NOT A MIGRATION.
-- This supersedes the separated P3-32 approval ledger for any future
-- acceptance-enabled architecture. Do not apply to remote/local D1 without
-- an independently approved NEW migration and binding review.
-- Requires existing R1-R4 p3_operations/p3_requests/events/nonces schema.
CREATE TABLE p3_atomic_approvals (
 approval_id TEXT PRIMARY KEY NOT NULL CHECK(length(approval_id)=36),
 approval_sha256 TEXT NOT NULL UNIQUE
   CHECK(length(approval_sha256)=64 AND approval_sha256 NOT GLOB '*[^0-9a-f]*'),
 operation_id TEXT NOT NULL UNIQUE
   REFERENCES p3_operations(operation_id) ON DELETE RESTRICT,
 operator_github_id INTEGER NOT NULL CHECK(operator_github_id=265665562),
 repository_id INTEGER NOT NULL CHECK(repository_id=1430581407),
 run_id INTEGER NOT NULL CHECK(run_id>0),
 run_attempt INTEGER NOT NULL CHECK(run_attempt BETWEEN 1 AND 100),
 workflow_sha TEXT NOT NULL CHECK(length(workflow_sha)=40
   AND workflow_sha NOT GLOB '*[^0-9a-f]*'),
 idempotency_key_hash TEXT NOT NULL CHECK(length(idempotency_key_hash)=64
   AND idempotency_key_hash NOT GLOB '*[^0-9a-f]*'),
 body_sha256 TEXT NOT NULL CHECK(length(body_sha256)=64
   AND body_sha256 NOT GLOB '*[^0-9a-f]*'),
 issued_at_sec INTEGER NOT NULL CHECK(issued_at_sec>0),
 expires_at_sec INTEGER NOT NULL CHECK(expires_at_sec>issued_at_sec
   AND expires_at_sec-issued_at_sec<=300),
 consumed_at_sec INTEGER NOT NULL CHECK(consumed_at_sec>=issued_at_sec
   AND consumed_at_sec<expires_at_sec)
);
CREATE INDEX p3_atomic_approvals_operation
  ON p3_atomic_approvals(operation_id);
-- IMPORTANT: new receiver MUST execute the operation INSERT, snapshot INSERT,
-- approval INSERT and existing p3_command_nonces INSERT in ONE D1.batch().
-- Existing accepted-audit trigger inserts the audit row inside the same txn.
-- Unlike the P3-32 consume-first prototype, no independent approval insertion.
-- Never purge uniqueness proofs; secure read-only status lookup is separate.
