# Fishing Companion V3 — maintenance and recovery

Cloudflare D1 and private R2 hold authoritative content. GitHub stores software, these instructions and approved public recovery archives, not live content. No PC or ChatGPT scheduled task is needed for normal maintenance.

## Routine maintenance

| Activity | Frequency | Execution |
| --- | --- | --- |
| Backup, orphan detection and results report | First day of each month, 4 a.m. Pacific | GitHub-hosted, automatic |
| On-demand orphan detection | As needed | Manual audit mode |
| On-demand backup and audit | After cleanup or before major changes | Manual complete mode |
| Orphan cleanup and retention review | As needed | ChatGPT-assisted, explicit approval |
| Recovery | As needed | Separately approved procedure |

- [Maintenance workflow](https://github.com/ginosega/fishing/actions/workflows/fishing-maintenance.yml)
- [Maintenance reports / issue #593](https://github.com/ginosega/fishing/issues/593) — subscribe for email and GitHub Mobile notifications.
- [Recovery archives](https://github.com/ginosega/fishing/releases)
- [Reusable ChatGPT orphan cleanup prompt](ORPHAN_CLEANUP_PROMPT.md)

Do not use the site, Save content, upload images or run cleanup during maintenance. The monthly schedule assumes exclusive access; temporary database unavailability is acceptable. No app shutdown, maintenance switch or keepalive is required.

### Read the monthly report

A successful report identifies the audit result, counts of Gear/KB/Catches, linked/registered/physical originals, unlinked candidates/associations, candidate bytes, integrity failures and verified original count. A complete run also reports whether the published ZIP passed independent download verification. R2-only objects may be staged; candidates are not approved deletions. No raw private content or credentials are posted.

- Audit PASS and backup PASS: no action beyond retention review if needed.
- REVIEW NEEDED: use the cleanup prompt as needed; R2-only candidates alone do not prevent an otherwise valid full backup. Non-public registered originals cause full publication to be withheld.
- Integrity failure, incomplete audit, or backup NOT VERIFIED: review the workflow and report with ChatGPT. Do not treat the archive as a valid replacement. Inspect any draft or published release before retrying; do not blindly rerun.
- No monthly report: check the workflow, notification subscription and settings. Public repositories can have scheduled workflows disabled after 60 days without repository activity. On the workflow page, use Enable workflow if disabled. Confirm both execution variables below are true, then run a manual complete backup if necessary. Owner checks only when a report is missing; no separate monitor or keepalive.

### Run a manual backup or audit

1. Stop using the site and close editors; do not initiate cleanup or upload while the workflow runs.
2. Open the maintenance workflow and choose **Run workflow**.
3. Select branch **main** and mode **complete** for a full backup plus audit, or **audit** for read-only orphan detection and registered-original verification without a recovery release.
4. Click Run workflow. Open the new run and its issue #593 report when complete; verify the job conclusion and, for complete mode, Backup PASS plus its Release link. Do not rerun an ambiguous failure.
5. Resume site use after completion. If run before a major change, retain that verified manual release until the change is accepted and recovery protection no longer needed.

No PowerShell is necessary for routine runs.

## Configuration (one-time or after credential replacement)

In [repository Actions secrets and variables](https://github.com/ginosega/fishing/settings/secrets/actions), configure the following without exposing values to ChatGPT, source, issues or logs.

| Repository secret | Purpose |
| --- | --- |
| FISH_D1_BACKUP_TOKEN | Dedicated account-scoped Cloudflare D1 Edit token (native export requires write permission for locking) |
| FISH_R2_ACCOUNT_ID | Cloudflare account ID |
| FISH_R2_ACCESS_KEY_ID | Bucket-scoped Object Read only R2 access key |
| FISH_R2_SECRET_ACCESS_KEY | Corresponding read-only R2 secret key |

| Repository variable | Normal value |
| --- | --- |
| FISH_MAINTENANCE_ISSUE | 593 |
| FISH_MAINTENANCE_ENABLED | true |
| FISH_MAINTENANCE_MONTHLY | true |

The D1 token is named Fishing D1 Backup, account-wide D1 Edit only, no expiration or IP restriction; owner approved this unavoidable permission scope. Workflow targets only fishing-v3-wp3-operations-test; never export the auth DB. R2 credential is Fishing Production Backup, read only for fishing-v3-owner-media-test. GitHub temporary workflow token has contents/issue write for Release and report operations. Do not add provider deploy or R2 deletion credentials to the workflow.

To suspend monthly runs but retain manual execution, set FISH_MAINTENANCE_MONTHLY=false. To suspend both, set FISH_MAINTENANCE_ENABLED=false. On credential replacement or workflow changes, verify a manual complete run before enabling monthly execution again. Use notification settings and subscribe to issue #593; email verified Nov 26, Android enabled by owner after first test (repeat test waived).

## Recovery archive policy

- Permanent baseline: [backup-baseline-2026-11-25](https://github.com/ginosega/fishing/releases/tag/backup-baseline-2026-11-25). SHA-256: 7F9C17B6790E2AFDA87123CFE9496BD4DC5189D6956DE1BF312D50F6EFEAB4C7. Independently downloaded and verified.
- First GitHub-hosted complete run: [Nov 26 manual archive](https://github.com/ginosega/fishing/releases/tag/fishing-backup-manual-2026-11-26-45894888693), 160010470 bytes, SHA-256 1cf9ae67b8107e15c47a73f96ff09f0d045d63e2a25b221a220d68c831dd004e. [Run and verification](https://github.com/ginosega/fishing/actions/runs/45894888693); 104 Gear, 61 KB, 14 Catch, 277 verified originals, zero orphan candidates. This is a dated checkpoint, not the current count.
- Retain the permanent baseline, latest three verified monthly archives and special/manual backups while needed. Never delete an unverified replacement's predecessor. Ordinary hosted maintenance does not require a PC or a permanently retained local copy. The owner explicitly approved disposal of the redundant primary-PC local archives after the verified hosted recovery backup; [approval](https://github.com/ginosega/fishing/issues/377#issuecomment-7203806459) and [postflight](https://github.com/ginosega/fishing/issues/377#issuecomment-7203867006). Retain any temporary or special local recovery evidence until its exact disposition is separately approved.
- Archives intentionally public and unencrypted under owner approval. No monthly manual review required; structural controls exclude auth DB, sessions, credentials, drafts, unregistered staging and non-public originals. No automatic detection of personally sensitive content in otherwise public records/photos. Full archive withheld if a registered original is no longer publicly referenced. Never upload a partial archive as full.
- A complete workflow restores native content SQL in memory, checks schema/integrity/FKs and production reference graph, lists R2, checks all registered sizes and SHA-256 digests, builds ZIP and verifies exact inventory, checks GitHub draft asset digests, publishes then independently downloads ZIP/checksum from the public URLs. Only then reports Backup PASS. No deployment.
- ZIP contents: content.sql (five current content/media tables), manifest.json, README.txt, images/ (each registered authorized original named by SHA-256). No application binaries or raw staging/logs. No credential values.

### Retention review

As needed, use Releases and maintenance reports to enumerate exact tags, verification receipts, asset sizes/digests and reason for retention. Count only independently verified monthly archives toward the three-month rule. Preserve baseline and still-needed manual/pre-major-change archives. Present exact candidates and obtain explicit owner approval before deleting any Release/tag/asset or local backup. Do not delete any backup just because its replacement was uploaded. The maintenance workflow never deletes anything.

## Recovery

1. Choose a verified backup and download ZIP plus .sha256 from its Release. Independently compare SHA-256 and size to release asset metadata and maintenance receipt; check exact manifest inventory, SQL digest, each original digest/size and total bytes.
2. Restore content.sql in a local empty SQLite database, check schema, integrity, foreign keys and content/media graph. Do not execute against production. Restore to a separate approved empty D1 and R2 recovery target only after owner approves exact provider scope and credentials.
3. Restore each original at its manifest storage key with recorded MIME and SHA-256 metadata. Verify references, original bytes, records and hosted acceptance. Software and authentication are recovered separately from repository and locally provisioned credentials; the content archive excludes them.
4. Switch production bindings only after separate owner acceptance and approval. The manifest records source revision at backup, not a claim that this exact revision was deployed. Do not overwrite running production or delete the original resources as part of a restore without explicit approval.

## Legacy local fallback (not routine)

The proven Windows script remains available as a contingency if hosted maintenance cannot run. Use a trusted checkout, Node 24, Git, Wrangler OAuth and existing read-only R2 credentials; stop editing first. No automated upload from this script. Review any local archive before public publication, including scope and newly private originals. Verify independent download and SHA-256 as above; do not publish unlinked/private originals.

From PowerShell (adjust the checkout path):
~~~powershell
Set-Location "$HOME"
npm install --prefix "$HOME\Fishing-Backups\tooling" --no-audit --no-fund @aws-sdk/client-s3
Set-Location "$HOME\fishing-o02-private"
powershell -NoProfile -ExecutionPolicy Bypass -File .\backups\create-backup.ps1
~~~

Add -Kind pre-major for a special backup. Script refuses overwrite. Keep work outside Downloads, do not share signed URLs or secrets, and preserve failed or unpublished recovery evidence until separately reviewed. Legacy procedure is not a requirement for the monthly schedule.
