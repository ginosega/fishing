# Fishing Companion Testing Feedback

_Started: 2026-08-31_

This is the temporary working log for mobile-first acceptance testing of Fishing Companion. Capture feedback as it is observed, keep the deployed test build stable during a testing pass when practical, then implement related items in batches. Retire this file after acceptance testing is complete and durable decisions/follow-ups have been moved to the canonical README, decision log, or TODO as appropriate.

## Testing approach

- Primary device/use case: phone first; desktop/tablet secondary.
- Capture first-impression reactions before familiarity masks usability problems.
- Classify observations as BUG, UI/UX, WORKFLOW, FEATURE, DATA/CONTENT, RECOMMENDATION LOGIC, or PERFORMANCE/OFFLINE.
- Do not require the user to pre-classify or prioritize feedback.
- Batch straightforward UI changes so the interface does not change underneath an active testing pass.
- Flag any requested change that would materially affect architecture, deployment, maintenance complexity, performance, or usability before implementing it; discuss the requirement's priority and tradeoff first.

---

## Home page — initial mobile impressions

### Positive feedback

- **UI/UX — KEEP:** Black and green visual treatment works very well, particularly with the phone in dark mode.
- **UI/UX — KEEP:** Current icon selections are strong.

### Requested changes

- **UI/UX — ACCEPTED:** Remove the `What do you want to do?` heading and its explanatory paragraph. Replace that hero content with the app name: **Fishing Companion**.
- **UI/UX — ACCEPTED:** Rename the first home button from **My Gear & Knots** to **My Gear**. Keep its existing subtext unchanged.
- **UI/UX / WORKFLOW — ACCEPTED:** Rename **Build a Fishing Plan** to **Knowledge Base**.
- **UI/UX — ACCEPTED:** Replace the Knowledge Base button subtext with: **Build a fishing plan based on your location, gear, and target species.**
- **UI/UX — ACCEPTED:** Remove the dynamic footer text showing the number of owned gear/tackle/knot records.
- **UI/UX — ACCEPTED:** Replace the footer with **© 2026 Gino Sega**.

### Implementation status

**QUEUED FOR NEXT UI BATCH.** Do not alter the deployed interface mid-pass unless a blocking bug requires it.
