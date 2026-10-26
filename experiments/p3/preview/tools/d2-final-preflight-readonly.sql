-- FISH118 D2: read-only, exact operation acceptance/merge preflight.
-- NEVER add mutating statements to this SQL file.
SELECT operation_id,state,pr_number,main_base_sha,pr_head_sha,workflow_run_id,merge_sha,reason_code
FROM p3_operations
WHERE operation_id = 'p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f';
