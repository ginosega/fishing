#!/usr/bin/env python3
"""Offline negative/positive fixtures for the operating-model document contract."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("project_ops_validator", Path(__file__).with_name("check_project_ops.py"))
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)

class OpsDocuments(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.base = self.root / "project-ops/v2"
        self.base.mkdir(parents=True)
        docs = {
            "START_HERE.md": "# Start\n\n## Read order\n[Current](CURRENT_STATE.md) [Queue](WORK_QUEUE.md)\n\n## Evidence boundaries\n",
            "CURRENT_STATE.md": "# Current\n\nLast reconciled (UTC): 2026-11-01\nSource baseline: test\n\n## Environments\nPrivate hosted: unknown\n\n## Active workstreams\n",
            "WORK_QUEUE.md": "# Queue\n\n## FISH-OPS-V2 — Pilot\nState: blocked\nOwner: project\nNext safe action: verify\nPrerequisites: test\nAcceptance: tests\nEvidence: local\n",
            "OPERATING_RULES.md": "# Rules\n\n## Authority and evidence\n\n## Owner approval gates\n\n## Publishing and recovery\n\n## Release validation\n\n## Project handoff\n",
            "DECISIONS_INDEX.md": "# Decisions\n\n| Topic | Catalog |\n| --- | --- |\n| Publishing | [open](decisions/topics/publishing.md) |\n",
        }
        for name, text in docs.items():
            (self.base / name).write_text(text, encoding="utf-8")
        topics = self.base / "decisions/topics"
        topics.mkdir(parents=True)
        (topics / "publishing.md").write_text(
            "# Publishing\n\n| ID | Choice | Status | Evidence |\n| --- | --- | --- | --- |\n| PUB-001 | Safe publishing | accepted | [History](https://example.org/record) |\n", encoding="utf-8")
        (self.root / "PROJECT_ROUTER.md").write_text(
            "# Router\nPrimary workstream: x\nActive workstreams: y\nRouted branch: z\nEntry point: path\nRouting reviewed at: today\n",
            encoding="utf-8")
        self.prompt = self.root / "NEW_CHAT_PROMPT.md"
        self.prompt.write_text(
            "# Recovery\n\n" + chr(96)*3 + "text\nUse ginosega/fishing PROJECT_ROUTER.md. Check rejected choices and unknown writes.\n" + chr(96)*3 + "\n",
            encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def assert_error(self, fragment):
        errors, _ = validator.validate(self.root)
        self.assertTrue(any(fragment in e for e in errors), errors)

    def test_valid_unknown_private_hosted(self):
        errors, _ = validator.validate(self.root)
        self.assertEqual([], errors)

    def test_missing_active_doc_fails(self):
        (self.base / "OPERATING_RULES.md").unlink()
        self.assert_error("missing required file")

    def test_duplicate_work_item_fails(self):
        path = self.base / "WORK_QUEUE.md"
        path.write_text(path.read_text(encoding="utf-8") + "\n## FISH-OPS-V2 — Other\nState: ready\nOwner: x\nNext safe action: x\nPrerequisites: x\nAcceptance: x\nEvidence: x\n", encoding="utf-8")
        self.assert_error("duplicate work ID")

    def test_bad_link_fails(self):
        path = self.base / "START_HERE.md"
        path.write_text(path.read_text(encoding="utf-8") + "\n[missing](lost.md)\n", encoding="utf-8")
        self.assert_error("broken relative link")

    def test_repo_traversal_fails(self):
        path = self.base / "START_HERE.md"
        path.write_text(path.read_text(encoding="utf-8") + "\n[escape](../../../outside.md)\n", encoding="utf-8")
        self.assert_error("unsafe link")

    def test_prompt_hardcoded_branch_fails(self):
        self.prompt.write_text(self.prompt.read_text(encoding="utf-8").replace("unknown writes", "unknown writes on feature/old-branch"), encoding="utf-8")
        self.assert_error("stale SHA")

    def test_current_verified_unknown_pass(self):
        errors, _ = validator.validate(self.root)
        self.assertEqual([], errors)

    def test_oversized_working_file_fails(self):
        p = self.base / "START_HERE.md"
        p.write_text(p.read_text(encoding="utf-8") + "A" * 4200, encoding="utf-8")
        self.assert_error("hard limit")

    def test_duplicate_decision_id_fails(self):
        p = self.base / "decisions/topics/publishing.md"
        p.write_text(p.read_text(encoding="utf-8") + "\n| PUB-001 | Duplicate | rejected | [History](https://example.org) |\n", encoding="utf-8")
        self.assert_error("duplicated decision ID")

    def test_unlinked_adr_fails(self):
        records = self.base / "decisions/records"
        records.mkdir()
        (records / "ADR-0001.md").write_text("# ADR\n**ID:** ADR-0001\n**Status:** accepted\n**Original evidence / approval:** source\n**Alternative considered / why rejected:** x\n**Reconsider only if:** x\n", encoding="utf-8")
        self.assert_error("no catalog links")

    def test_verified_hosted_without_date_or_link_fails(self):
        p = self.base / "CURRENT_STATE.md"
        p.write_text(p.read_text(encoding="utf-8") +
            "\n| Environment | Source | CI | Private hosted | Public hosted | Field acceptance | Observed at / evidence |\n"
            "| --- | --- | --- | --- | --- | --- | --- |\n"
            "| sandbox | code | pass | verified | unknown | unknown | no evidence |\n",
            encoding="utf-8")
        self.assert_error("claimed hosted/field status missing observed_at date")
        self.assert_error("claimed hosted/field status missing evidence link")

    def test_verified_hosted_with_dated_link_passes(self):
        p = self.base / "CURRENT_STATE.md"
        p.write_text(p.read_text(encoding="utf-8") +
            "\n| Environment | Source | CI | Private hosted | Public hosted | Field acceptance | Observed at / evidence |\n"
            "| --- | --- | --- | --- | --- | --- | --- |\n"
            "| sandbox | code | pass | verified | unknown | unknown | 2026-11-01 [proof](https://example.org/proof) |\n",
            encoding="utf-8")
        errors, _ = validator.validate(self.root)
        self.assertEqual([], errors)

    def test_silent_uninstalled_no_error(self):
        empty = self.root / "no-docs"
        empty.mkdir()
        errs, warnings = validator.validate(empty)
        self.assertEqual([], errs)
        self.assertTrue(warnings)

if __name__ == "__main__":
    unittest.main()
