CREATE TABLE IF NOT EXISTS p3_requests (
  operation_id TEXT PRIMARY KEY NOT NULL REFERENCES p3_operations(operation_id) ON DELETE CASCADE,
  request_json TEXT NOT NULL CHECK(length(request_json)>0 AND length(request_json)<=262144),
  payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
  created_at INTEGER NOT NULL
);
CREATE TRIGGER IF NOT EXISTS p3_operation_accepted_audit AFTER INSERT ON p3_operations BEGIN
  INSERT INTO p3_events(operation_id,event_type,from_state,to_state,event_at)
  VALUES(NEW.operation_id,'accepted',NULL,'Accepted',NEW.created_at);
END;
CREATE TRIGGER IF NOT EXISTS p3_operation_transition_guard BEFORE UPDATE OF state ON p3_operations
WHEN OLD.state<>NEW.state AND NOT (
  (OLD.state='Accepted' AND NEW.state IN ('Validating','Failed')) OR
  (OLD.state='Validating' AND NEW.state IN ('Checking','Conflict','Failed')) OR
  (OLD.state='Checking' AND NEW.state IN ('Merging','Conflict','Failed')) OR
  (OLD.state='Merging' AND NEW.state IN ('Deploying','Conflict','Failed')) OR
  (OLD.state='Deploying' AND NEW.state IN ('Verifying','Failed')) OR
  (OLD.state='Verifying' AND NEW.state IN ('Live','Failed'))
)
BEGIN
  SELECT RAISE(ABORT,'invalid_p3_state_transition');
END;
CREATE TRIGGER IF NOT EXISTS p3_operation_transition_audit AFTER UPDATE OF state ON p3_operations
WHEN OLD.state<>NEW.state BEGIN
  INSERT INTO p3_events(operation_id,event_type,from_state,to_state,event_at,error_code)
  VALUES(NEW.operation_id,'transition',OLD.state,NEW.state,NEW.updated_at,NEW.reason_code);
END;
