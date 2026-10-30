-- FISH118 D2 one-time recovery: GitHub sandbox PR #16 was independently
-- verified MERGED at 89be79a9c933dd36bd909edd585091232831c835.
-- Its sole parent is the exact recorded base and ONLY Gear/gear.json changed.
-- This SQL MUST NEVER issue any GitHub API request or replay a merge.
-- It changes exactly one D1 operation ONLY while its old lease has expired.
-- Merging -> Deploying invokes existing audit and transition guard triggers.
UPDATE p3_operations
SET state = 'Deploying',
    merge_sha = '89be79a9c933dd36bd909edd585091232831c835',
    reason_code = NULL,
    lease_owner = NULL,
    lease_expires_at = NULL,
    updated_at = CAST(strftime('%s','now') AS INTEGER)
WHERE operation_id = 'p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f'
  AND github_id = 265665562
  AND repo_id = 1430581407
  AND state = 'Merging'
  AND pr_number = 16
  AND main_base_sha = '69b236c8af663cdce687dc855bb117a01874060a'
  AND pr_head_sha = 'fc7879d67217e0f0a36676e40dadbce7060f66a6'
  AND workflow_run_id = 40288266980
  AND reason_code = 'merge_attempted'
  AND merge_sha IS NULL
  AND verified_release_id IS NULL
  AND (lease_expires_at IS NULL
       OR lease_expires_at <= CAST(strftime('%s','now') AS INTEGER))
  AND (SELECT COUNT(*) FROM p3_operations) = 1
  AND (SELECT COUNT(*) FROM p3_requests
       WHERE operation_id = 'p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f') = 1
RETURNING operation_id, state, pr_number, workflow_run_id, merge_sha, reason_code;
