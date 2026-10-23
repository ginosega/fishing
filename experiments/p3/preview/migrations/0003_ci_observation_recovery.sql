-- FISH118 P3-12. SOURCE-ONLY migration: DO NOT APPLY to Cloudflare D1 yet.
-- Auditable CI observation and recovery while operation remains Checking.
-- No SQL statement here allows Merging, GitHub writes or publishing.
CREATE TABLE IF NOT EXISTS p3_ci_observations (
 operation_id TEXT PRIMARY KEY NOT NULL REFERENCES p3_operations(operation_id),
 repo_id INTEGER NOT NULL CHECK(repo_id=1430581407),
 pr_number INTEGER NOT NULL CHECK(pr_number>0),
 head_sha TEXT NOT NULL CHECK(length(head_sha)=40),
 base_sha TEXT NOT NULL CHECK(length(base_sha)=40),
 branch TEXT NOT NULL CHECK(length(branch)>0 AND length(branch)<=128),
 state TEXT NOT NULL CHECK(state IN ('pending','retry','review','passed')),
 check_run_id INTEGER,
 reason_code TEXT,
 attempts INTEGER NOT NULL CHECK(attempts BETWEEN 1 AND 12),
 observed_at INTEGER NOT NULL CHECK(observed_at>=0),
 next_poll_at INTEGER,
 CHECK((state='passed' AND check_run_id>0 AND reason_code IS NULL AND next_poll_at IS NULL)
   OR (state IN ('pending','retry') AND check_run_id IS NULL AND reason_code IS NOT NULL AND next_poll_at>observed_at)
   OR (state='review' AND check_run_id IS NULL AND reason_code IS NOT NULL AND next_poll_at IS NULL))
);
CREATE TABLE IF NOT EXISTS p3_ci_observation_audit (
 audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
 operation_id TEXT NOT NULL REFERENCES p3_operations(operation_id),
 attempt INTEGER NOT NULL,
 state TEXT NOT NULL,
 check_run_id INTEGER,
 reason_code TEXT,
 observed_at INTEGER NOT NULL,
 next_poll_at INTEGER,
 UNIQUE(operation_id,attempt)
);
CREATE TRIGGER IF NOT EXISTS p3_ci_observation_insert_audit
AFTER INSERT ON p3_ci_observations
BEGIN
 INSERT INTO p3_ci_observation_audit(operation_id,attempt,state,check_run_id,reason_code,observed_at,next_poll_at)
 VALUES(NEW.operation_id,NEW.attempts,NEW.state,NEW.check_run_id,NEW.reason_code,NEW.observed_at,NEW.next_poll_at);
END;
CREATE TRIGGER IF NOT EXISTS p3_ci_observation_update_audit
AFTER UPDATE ON p3_ci_observations
BEGIN
 INSERT INTO p3_ci_observation_audit(operation_id,attempt,state,check_run_id,reason_code,observed_at,next_poll_at)
 VALUES(NEW.operation_id,NEW.attempts,NEW.state,NEW.check_run_id,NEW.reason_code,NEW.observed_at,NEW.next_poll_at);
END;
