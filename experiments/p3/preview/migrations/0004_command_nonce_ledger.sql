-- FISH118 P3-21. SOURCE ONLY: DO NOT APPLY TO REMOTE D1 WITHOUT R4 APPROVAL.
-- Sandbox-exclusive single-use authenticated internal-command replay ledger.
-- No GitHub write, Worker deployment, publishing or production access.
CREATE TABLE IF NOT EXISTS p3_command_nonces (
 nonce_sha256 TEXT PRIMARY KEY NOT NULL
  CHECK(length(nonce_sha256)=64 AND nonce_sha256 NOT GLOB '*[^0-9a-f]*'),
 github_id INTEGER NOT NULL CHECK(github_id>0),
 repo_id INTEGER NOT NULL CHECK(repo_id=1430581407),
 issued_at_ms INTEGER NOT NULL CHECK(issued_at_ms>0),
 consumed_at_ms INTEGER NOT NULL CHECK(consumed_at_ms>=issued_at_ms)
);
CREATE INDEX IF NOT EXISTS p3_command_nonces_consumed_at ON p3_command_nonces(consumed_at_ms);
