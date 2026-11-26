# Fishing Companion V3 — recovery backups

The repository stores software and these instructions. Cloudflare D1 and R2 are the authoritative fishing content. GitHub Releases hold the approved public recovery archives, not live content.

## Recovery policy

- Permanent initial baseline: [backup-baseline-2026-11-25](https://github.com/ginosega/fishing/releases/tag/backup-baseline-2026-11-25). Archive SHA-256: `7F9C17B6790E2AFDA87123CFE9496BD4DC5189D6956DE1BF312D50F6EFEAB4C7`. Independently downloaded and verified.
- Monthly: retain the latest three verified monthly archives; retain pre-major-migration backups until no longer needed. Keep the latest verified local archive and checksum.
- Do not delete the baseline. Retention deletions require explicit owner review of the exact release/assets and local files. This tooling never deletes releases or data.
- Archives are intentionally unencrypted/public under the owner's approval. Review current fishing records and images for newly sensitive material before publication. Do not publish credentials, authentication database, session data, raw logs or staging folders.

## Monthly procedure (Windows PowerShell)

Use a current trusted checkout with Node 24, Git and Wrangler access. Keep the backup outside Downloads. First-time SDK setup (or reuse an existing SDK directory via `-SdkRoot`):

```powershell
Set-Location "$HOME"
npm install --prefix "$HOME\Fishing-Backups\tooling" --no-audit --no-fund @aws-sdk/client-s3
```

Close editors and stop content changes/media cleanup during the backup. From the checkout (adjust to the actual local path):

```powershell
Set-Location "$HOME\fishing-o02-private"
powershell -NoProfile -ExecutionPolicy Bypass -File .\backups\create-backup.ps1
```

For a pre-major backup, add `-Kind pre-major`. If the existing archive/work directory for that date exists, stop and inspect it; the script refuses to overwrite it. The script uses the existing content DB and bucket names (not authentication). Supply locally held bucket-scoped read-only R2 credentials when prompted. It restores the fresh SQL export in memory, checks schema/integrity/FKs, downloads and SHA-256 checks every registered original, and independently hashes every entry in the ZIP. Counts come from the current export rather than the initial baseline. Any failure prevents a PASS/checksum receipt; preserve failed work files locally.

After local PASS:
1. Review the ZIP and confirm it contains only the five content/media tables, manifest, instructions and registered originals. Upload only the ZIP and .sha256 to a new GitHub Release with tag matching the archive stem (e.g. `fishing-backup-monthly-YYYY-MM-DD`), targeting the current software revision. No CI deployment is triggered by this release.
2. Compare GitHub's ZIP asset digest to the local SHA-256, then independently download the ZIP to a different path and verify using `Get-FileHash -Algorithm SHA256`. Record tag, date, archive bytes, SHA-256, and verification result in the backup receipt. A GitHub upload is not a verified recovery backup until the independent download matches.
3. Review the retention policy. Preserve baseline, current three verified monthly releases and still-needed special backups. Remove older copies/staging files only after explicit confirmation. Never delete an unverified replacement's predecessor.

## Recovery

Restore in a separate, approved empty recovery database and bucket, not over the running service. Verify the ZIP SHA-256 and every manifest entry. Restore content.sql and each original image to its exact storage key, preserving MIME and SHA-256 metadata. Validate all references, original bytes and record contents. Re-establish authentication separately, using the current software and locally provisioned credentials. Only switch production bindings after acceptance and owner approval. The initial baseline used the same archive format; the monthly manifest records the source revision at preparation, not a claim that this revision was deployed.
