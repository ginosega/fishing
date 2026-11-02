#!/usr/bin/env python3
"""Offline/standard-library validator; it cannot attest hosted deployments."""
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import unquote

ACTIVE = "project-ops/v2"
LIMITS = {
    "START_HERE.md": (2048, 4096),
    "CURRENT_STATE.md": (8192, 12288),
    "WORK_QUEUE.md": (10240, 16384),
    "OPERATING_RULES.md": (10240, 16384),
    "DECISIONS_INDEX.md": (5120, 8192),
}
REQUIRED = {
    "START_HERE.md": ["## Read order", "## Evidence boundaries"],
    "CURRENT_STATE.md": ["Last reconciled (UTC):", "Source baseline:", "## Environments", "## Active workstreams"],
    "WORK_QUEUE.md": ["## FISH-OPS-V2"],
    "OPERATING_RULES.md": ["## Authority and evidence", "## Owner approval gates", "## Publishing and recovery", "## Release validation", "## Project handoff"],
    "DECISIONS_INDEX.md": ["| Topic |", "decisions/topics/"],
}
WORK_STATES = {"blocked", "ready", "in-progress", "review", "closed"}
DECISION_STATES = {"accepted", "rejected", "superseded", "deferred", "proposed"}
LINK = re.compile(r"(?<!!)\[[^\]\n]+\]\(([^)\n]+)\)")
WORK_HEADING = re.compile(r"^## ([A-Z][A-Z0-9-]+) (?:—|-)", re.M)
ROW = re.compile(r"^\|\s*([A-Z]{2,}-\d{3})\s*\|\s*([^|]*)\|\s*([a-z-]+)\s*\|", re.M)

def validate(root: Path, *, allow_uninstalled=True):
    root = root.resolve()
    errors, warnings = [], []
    active = root / ACTIVE
    absent = [n for n in LIMITS if not (active / n).is_file()]
    if len(absent) == len(LIMITS) and allow_uninstalled:
        return [], ["Active documents not yet installed; running tooling-contract checks only"]
    for name in absent:
        errors.append(f"{ACTIVE}/{name}: missing required file")
    if absent:
        return errors, warnings
    checks = [active / n for n in LIMITS]
    for name, (soft, hard) in LIMITS.items():
        path = active / name
        txt = path.read_text(encoding="utf-8")
        size = len(path.read_bytes())
        if size > hard:
            errors.append(f"{name}: {size} bytes exceeds hard limit {hard}")
        elif size > soft:
            warnings.append(f"{name}: {size} bytes exceeds soft target {soft}")
        for field in REQUIRED[name]:
            if field not in txt:
                errors.append(f"{name}: missing field: {field}")
        if not txt.lstrip().startswith("# "):
            errors.append(f"{name}: missing H1")
    for name in ("PROJECT_ROUTER.md", "NEW_CHAT_PROMPT.md"):
        path = root / name
        if not path.is_file():
            errors.append(f"{name}: missing default-branch routing artifact")
        else:
            checks.append(path)
    router = root / "PROJECT_ROUTER.md"
    if router.is_file():
        txt = router.read_text(encoding="utf-8")
        for field in ("Primary workstream:", "Active workstreams:", "Routed branch:", "Entry point:", "Routing reviewed at:"):
            if field not in txt:
                errors.append(f"PROJECT_ROUTER.md: missing {field}")
    prompt = root / "NEW_CHAT_PROMPT.md"
    if prompt.is_file():
        txt = prompt.read_text(encoding="utf-8")
        fence = chr(96) * 3
        blocks = re.findall(re.escape(fence) + r"text\n(.*?)\n" + re.escape(fence), txt, re.S)
        if len(blocks) != 1:
            errors.append("NEW_CHAT_PROMPT.md: expected one fenced text prompt")
        else:
            copy = blocks[0]
            if len(copy.encode()) > 2400:
                errors.append("NEW_CHAT_PROMPT.md: static prompt exceeds 2400 bytes")
            if not all(s in copy for s in ("PROJECT_ROUTER.md", "ginosega/fishing", "unknown", "rejected")):
                errors.append("NEW_CHAT_PROMPT.md: missing router/repository/uncertainty/negative-decision instructions")
            if re.search(r"\bfeature/[\w/-]+|#[0-9]{2,}|(?<![0-9a-f])[0-9a-f]{40}(?![0-9a-f])", copy):
                errors.append("NEW_CHAT_PROMPT.md: stale SHA, branch, or issue ID in static text")
    # Evidence-bearing environment status must not claim deployed/accepted
    # without a dated pointer. The checker never verifies the pointer's truth.
    current = (active / "CURRENT_STATE.md").read_text(encoding="utf-8")
    for ln, line in enumerate(current.splitlines(), 1):
        if not (line.startswith("|") and not line.startswith("| ---")):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) < 7 or cells[0] == "Environment":
            continue
        observed = cells[6]
        for field in cells[3:6]:
            positive = re.search(r"\b(verified|deployed|accepted)\b", field, re.I)
            negated = re.search(r"\b(not|un|never|unknown|pending)\s+(?:yet\s+)?(?:verified|deployed|accepted)\b", field, re.I)
            if positive and not negated:
                if not re.search(r"20\d{2}-\d{2}-\d{2}", observed):
                    errors.append(f"CURRENT_STATE.md:{ln}: claimed hosted/field status missing observed_at date")
                if not re.search(r"\[[^\]]+\]\((?:https?://|[^)#]+)", observed):
                    errors.append(f"CURRENT_STATE.md:{ln}: claimed hosted/field status missing evidence link")
    work = (active / "WORK_QUEUE.md").read_text(encoding="utf-8")
    hs = list(WORK_HEADING.finditer(work))
    seen_work = set()
    for i, m in enumerate(hs):
        wid = m.group(1)
        if wid in seen_work:
            errors.append(f"WORK_QUEUE.md: duplicate work ID {wid}")
        seen_work.add(wid)
        block = work[m.end():hs[i + 1].start() if i + 1 < len(hs) else len(work)]
        for field in ("State:", "Owner:", "Next safe action:", "Prerequisites:", "Acceptance:", "Evidence:"):
            if field not in block:
                errors.append(f"WORK_QUEUE.md: {wid} missing {field}")
        sm = re.search(r"^State:\s*([a-z-]+)", block, re.M)
        if not sm or sm.group(1) not in WORK_STATES:
            errors.append(f"WORK_QUEUE.md: {wid} invalid state")
    topics = active / "decisions/topics"
    records = active / "decisions/records"
    catalog_files = sorted(topics.glob("*.md")) if topics.is_dir() else []
    if not catalog_files:
        errors.append("decisions/topics: no indexed catalogs")
    seen_ids, referenced_records = set(), set()
    for p in catalog_files:
        checks.append(p)
        txt = p.read_text(encoding="utf-8")
        size = len(p.read_bytes())
        if size > 12288:
            errors.append(f"{p.relative_to(root)}: topic exceeds 12288 bytes")
        elif size > 8192:
            warnings.append(f"{p.relative_to(root)}: topic exceeds soft budget")
        for m in ROW.finditer(txt):
            did, _, status = m.groups()
            if did in seen_ids:
                errors.append(f"{p.relative_to(root)}: duplicated decision ID {did}")
            seen_ids.add(did)
            if status not in DECISION_STATES:
                errors.append(f"{p.relative_to(root)}: invalid status {did}={status}")
        referenced_records.update(re.findall(r"ADR-\d{4}\.md", txt))
    for p in sorted(records.glob("ADR-*.md")) if records.is_dir() else []:
        checks.append(p)
        txt = p.read_text(encoding="utf-8")
        expected = p.stem
        for field in (f"**ID:** {expected}", "**Original evidence / approval:**", "**Alternative considered / why rejected:**", "**Reconsider only if:**"):
            if field not in txt:
                errors.append(f"{p.relative_to(root)}: missing {field}")
        st = re.search(r"\*\*Status:\*\*\s*([a-z-]+)", txt)
        if not st or st.group(1) not in DECISION_STATES:
            errors.append(f"{p.relative_to(root)}: invalid decision status")
        if p.name not in referenced_records:
            errors.append(f"{p.relative_to(root)}: no catalog links to ADR")
    # Validate all governance Markdown references, not only the five active
    # documents and indexed decisions. This catches broken links in approvals,
    # handoff plans and ancillary audit records as the corpus evolves.
    for p in sorted(active.rglob("*.md")):
        if p not in checks:
            checks.append(p)

    prior = []
    for p in checks:
        txt = p.read_text(encoding="utf-8")
        for m in LINK.finditer(txt):
            target = m.group(1).split(" ", 1)[0].strip("<>")
            if not target or target.startswith(("#", "https://", "http://", "mailto:", "data:")):
                continue
            rel = unquote(target.split("#", 1)[0].split("?", 1)[0])
            if not rel:
                continue
            resolved = (p.parent / rel).resolve()
            if not resolved.is_relative_to(root):
                errors.append(f"{p.relative_to(root)}: unsafe link outside repository: {target}")
            elif not resolved.exists():
                errors.append(f"{p.relative_to(root)}: broken relative link: {target}")
        if p.name in LIMITS:
            blocks = {re.sub(r"\s+", " ", q).strip() for q in re.split(r"\n\s*\n", txt)}
            prior.append((p.name, {q for q in blocks if len(q) >= 280 and not q.startswith("#")}))
    for i, (n, ps) in enumerate(prior):
        for other, qs in prior[i+1:]:
            if ps.intersection(qs):
                errors.append(f"Active docs {n} and {other} duplicate substantial paragraphs")
    return errors, warnings

def check_governance_scope(paths):
    """Prevent unrelated PWA/runtime/workflow files from entering the governance branch."""
    allowed_files = {
        "PROJECT_ROUTER.md",
        "NEW_CHAT_PROMPT.md",
        "tools/check_project_ops.py",
        "tools/test_project_ops.py",
        ".github/workflows/governance-docs.yml",
    }
    return [
        f"{name}: non-governance change not permitted on governance/project-ops"
        for name in paths
        if name not in allowed_files and not name.startswith("project-ops/v2/")
    ]


def check_approval_diffs(root):
    base = os.environ.get("PR_BASE_SHA")
    if not base:
        return []
    result = subprocess.run(["git", "diff", "--name-only", base + "...HEAD"], cwd=root, capture_output=True, text=True)
    if result.returncode:
        return ["Could not verify approved-source protection against PR base: " + result.stderr.strip()]
    changed = result.stdout.splitlines()
    failures = [f"{name}: edit to original approved source requires separate owner-scoped review" for name in changed if re.fullmatch(r"pwa/docs/Fishing_Companion_v3_(?:Requirements|Technical_Design|Implementation_Plan|.*Approval_2026-10-19)\.md", name)]
    if os.environ.get("GITHUB_BASE_REF") == "governance/project-ops":
        failures.extend(check_governance_scope(changed))
    return failures

def main():
    root = Path(__file__).resolve().parent.parent
    # No "not installed" fixture bypass on the protected canonical branch:
    # deleting every active doc must be a hard failure, including in CI.
    canonical = (
        os.environ.get("GITHUB_BASE_REF") == "governance/project-ops"
        or os.environ.get("GITHUB_REF") == "refs/heads/governance/project-ops"
    )
    errors, warnings = validate(root, allow_uninstalled=not canonical)
    errors.extend(check_approval_diffs(root))
    for msg in warnings:
        print("WARN:", msg)
    for msg in errors:
        print("ERROR:", msg, file=sys.stderr)
    if errors:
        print(f"Documentation validation failed with {len(errors)} error(s)", file=sys.stderr)
        return 1
    print("Documentation structural validation passed (not hosted-state verification)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
