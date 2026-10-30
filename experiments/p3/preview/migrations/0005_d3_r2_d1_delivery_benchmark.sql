-- FISH118 D3: ISOLATED delivery benchmark; NOT a production content pointer.
-- Intended only for existing fishing-p3-sandbox D1, after read-only schema
-- and migration history checks. Never run against fishing-auth-p0 or public
-- source. Existing p3_* operations/sessions/audit tables are not modified.
CREATE TABLE p3_delivery_benchmark_pointer (
 scope TEXT PRIMARY KEY NOT NULL CHECK(scope='d3-r2-d1-v1'),
 active_version TEXT,
 active_sha256 TEXT,
 last_run_id TEXT,
 updated_at INTEGER,
 CHECK(
  (active_version IS NULL AND active_sha256 IS NULL AND last_run_id IS NULL)
  OR
  (active_version IS NOT NULL AND active_sha256 IS NOT NULL AND
   last_run_id IS NOT NULL AND active_version=last_run_id AND
   length(active_version)=38 AND
   substr(active_version,1,6)='bench_' AND
   substr(active_version,7) NOT GLOB '*[^0-9a-f]*' AND
   length(active_sha256)=64 AND
   active_sha256 NOT GLOB '*[^0-9a-f]*')
 ),
 CHECK(updated_at IS NULL OR updated_at>=0)
);
INSERT INTO p3_delivery_benchmark_pointer
 (scope,active_version,active_sha256,last_run_id,updated_at)
 VALUES('d3-r2-d1-v1',NULL,NULL,NULL,NULL);
