# FISH118 P3-41 — Independent owner review, attestor trust and signing UX

**Checkpoint:** October 25, 2026 PDT. **Disposition:** SOURCE-ONLY design and local cryptographic tests on public draft PR #263. No owner/attestor private key generated or provisioned; no executable owner signing UX installed; no source, credential or independent attestor copied into the private sandbox or Cloudflare; no actual D1 write, publishing, enabled Worker, GitHub App token, or production deployment.

## 1. Grounded project state and threat to solve

At the start of P3-41, production `ginosega/fishing` main was `587b978118df64cc9ec584375c458fa2b10fecfa`; unmerged public draft `feature/fish118-p3-mock-publisher` / [PR #263](https://github.com/ginosega/fishing/pull/263) was `22b40114c1dedad286bd9ad255db52eb9b6a4e8e`; private sandbox main was `69b236c8af663cdce687dc855bb117a01874060a`. These are independently checked repository state, not user-entered metadata. Prior genuine owner-dispatched [GitHub OIDC verification #40207347824](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40207347824) successfully verified signed GitHub runner identity, but **only** for the installed read-only workflow. P3-39 created an isolated **local** combined OIDC + GitHub App metadata checker and explicitly forbids silently moving the write-capable App private key into GitHub Actions. P3-40 created the separate unsigned exact-command review builder and locally proved compatibility with detached owner ECDSA, command HMAC and the P3-36 canonical envelope. **None of this is a deployed privileged command workflow.**

**Attack:** A compromised runner can display a legitimate-looking summary or digest, substitute content before the owner signs, bind approval to a different run, or reuse a signature. A P3-40 `verified:true` object from a caller is not by itself authenticated evidence, and a UI confirmation from an untrusted browser does not prove human consent.

**Defense in depth:** require one genuinely independent content source and a **separate, pinned attestor public key** whose private signing key does not share custody with the runner, GitHub App PEM, Cloudflare command HMAC, publishing backend, or owner ECDSA approval key. The attestor validates its own content source and binds raw command hash, exact run/attempt/workflow, idempotency key, approval ID and expiry. The owner-side reviewer validates that separate signature and independently supplied **full command bytes**, then displays the entire operation for a distinct conscious human decision. Only after that decision should an **independent owner-held signing device** generate the existing P3-34 approval signature. The attestation signature is **not** that owner signature.

This additional attestor is a proposed trust root, not an installed service, allocated credential, current GitHub feature or permission already in the system. A compromised attestor or untrusted channel supplying both source and attestation can still lie. The source tests below prove signature and substitution logic under local fixtures, NOT operational independence or true user presence.

## 2. Source-only independent attestation verifier

**`src/p3-independent-owner-review.mjs`** exports `createP3IndependentOwnerReview`, accepting only a caller-pinned **public** ES256/P-256 JWK (rejects JWK private `d`) plus an injected clock. The sole public method is `inspect`. It has NO signing primitive, random key/approval issuance, GitHub/Cloudflare network defaults, D1, storage, publishing route or dispatcher.

The `inspect` inputs are:

- `proposed`: the exact **unsigned** P3-40 review material with unmodified canonical P3-34 approval, full raw command, original command digest, per-operation/run SHA, issue/expiry, and domain-separated signing message.
- `independentBody`: independently fetched/reconstructed **complete byte-identical canonical command string** with 8,192-byte UTF-8 cap, not a convenience copy of the candidate runner's own packet.
- `attestation`: strict, fixed-version twelve-field independent content assertion: `v=1`, `purpose=p3-independent-owner-content-v1`, repository ID **1430581407**, owner ID **265665562**, exact run ID/attempt/workflow SHA, one approval UUIDv4, one idempotency key, raw-body SHA-256 and 5-minute-bounded issuance/expiry.
- `signature`: canonical raw 64-byte P-256 ECDSA signature, base64url encoded, on **`p3-independent-owner-content-v1\n` + exact ordered attestation JSON**.

Only a valid signature under the **separately pinned attestor public key** permits the equality check to be considered authenticated. The verified exact independent body must equal the original P3-40 command **byte for byte** and all hashes, action, approval ID, workflow/run, expiration and idempotency values must match. A matching hash is *not* permission to skip byte equality. Unsigned/changed/bad-format/expired/foreign repo/workflow/run/attestation attempts fail closed.

The response intentionally returns `independentAttestationVerified:true`, `unsigned:true`, `requiresFullHumanReview:true`, `ownerSignaturePresent:false`, `mayExecute:false`, complete command **for private display only**, exact hashes and signing message **for later owner-side use**. It returns neither a private key nor an ECDSA approval signature or a command/operation ID. The backend's **single D1 atomic ledger**, not an in-memory review token or UI acknowledgement, must enforce one-use replay resistance after eventual execution.

**Independent channel requirement is NOT solved just by injected callbacks:** the attestation key's custody, authoritative source retrieval, PIN ceremony, revocation policy, owner-device authentication, and private content transport need further specification and explicit approval before any real use. If the runner chooses both `independentBody` and an attestor it controls, the proof is circular and unacceptable.

## 3. Proposed owner UX: private local device, complete operation and explicit review

This is a **flow specification, not a deployed screen or a button that currently signs**. Never use the production PWA itself as a trusted signer merely because it displays a familiar logo.

| Owner-side stage | Minimum information shown | Required behavior |
| --- | --- | --- |
| **Receive** | Source identity and source revision/fingerprint of the independently obtained content; trusted attestor key ID/fingerprint | Reject missing/unknown pin, wrong origin, copied runner-only material, stale/revoked attestation |
| **Compare** | Exact operation `accept`, package domain (`gear`/`kb`), `add`/`edit`, record ID, entire command JSON and semantic before/after comparison against independent canonical source | Scrollable full content and all changed fields, no truncated diff. No media uploads in current scope. Owner verifies full command, not a title or hash alone |
| **Verify** | Full SHA-256 of exact command, signer message digest, numeric repo/owner IDs, exact workflow file/commit, GitHub run ID + attempt, unique approval ID, idempotency key, expiry clock countdown | Display PASS only after independent attestor signature and all exact-byte/run comparisons. Distinguish verified evidence from unsigned candidate. Do not reveal JWT or App/Access/HMAC credential |
| **Review decision** | **Approve one Accepted operation** vs **Reject**; explicit warning that Accepted is neither Published nor Live | Default Reject. Require active human confirmation after full review and a separate owner-side sign action. A checkbox or typed digest is not cryptographic human presence |
| **External sign** | Canonical `p3-operator-approval-v1\n` message and SHA-256 computed **by owner device** | Signature key stays nonexportable/owner-controlled; do NOT sign if expiry, run, bytes, attestor pin or content changes. Never sign in GitHub Actions, worker, PWA, ChatGPT or a GitHub Action artifact |
| **Receipt/recovery** | Local approval ID and exact requested operation hash; on eventual acceptance, immutable operation ID and `Accepted` only | Uncertain/lost receipt = **UNKNOWN**, never auto-retry using same approval. Reconcile through separately authenticated read-status before any new owner decision |

The owner must have an independent way to know that the entire canonical content represents the change they actually want. Even a correct digest, a valid GitHub OIDC token, a valid independent attestation and an authentic signature are insufficient if the owner never read the change.

## 4. Threat boundary table

| Attacker or failure | P3-41 local control | Residual work / no claim of closure |
| --- | --- | --- |
| Compromised runner swaps content or run after displaying summary | Independently signed attestation plus raw-byte equality and run/approval binding | Separate, authenticated independent-source path and keys must be provisioned |
| Attacker edits attestation, fakes signature or adds unsigned fields | Strict fixed-shape canonical ECDSA and pinned public JWK; unknown fields denied | Pin distribution, rotation, revocation, audit and key-loss plan required |
| Attestor and runner share secret custody | **NOT blocked by this module**; explicitly invalid architecture | Enforce actual custody separation via isolation and independent audit |
| Owner device/PWA/browser is compromised | **NOT solved by JavaScript source tests** | Trusted platform, protected screen and key custody, anti-clickjacking/CSRF and integrity review required |
| Expired/moving run, new command content, approval replay | Bound run ID/attempt/workflow SHA, exact digest and 300-second validity | Real signed GitHub OIDC/App verification, HMAC and single-use D1 ledger enforced at future disabled-by-default receiver |
| HMAC/Access or GitHub App key compromise | Unrelated proofs; P3-41 exposes neither key | Continue existing separation and deny-by-default private service-binding gating |
| Mismatched semantic changes hidden by valid JSON | Full-body display required but **no source-aware diff implementation yet** | Must compare canonical repository content and validate package semantics, references and media inventory before signing |
| Lost response, ambiguous DB batch, duplicate user intent | Never returns executable authority; no retry on uncertain outcome | Separately authenticated status read and human recovery procedure remain future work |

## 5. Source-only adversarial test evidence and explicit limitations

`test/p3-independent-owner-review.test.mjs` adds nine local cases `P3-I01` to `P3-I09`: independently generated ECDSA signing key and pinned public JWK; exact content and full review output; forged and tampered attestations; separately signed but different content; signed mismatched run/approval/branch SHA; tampered P3-40 candidate; expiry, foreign purpose, additional unsigned fields; private-key rejection and no network/signing capability. These checks do **not** create a live attestor or an owner signer. The attestor key is **disposable fixture material** from a local Node crypto test, not a real private key to keep, deploy, or share.

The previous P3-40 exact-head source validation was **429/429 tests** (80 PWA, 43 broker, 306 P3). With nine new independent-review tests, the expected total is **438/438**, contingent on exact source and final documentation CI. No current provider call is implied by a CI PASS.

## 6. Remaining significant gating decisions

1. **No mandatory intermediate approval needed** to continue source-only designs and adversarial tests. The user has preapproved these.
2. Before any live use, independently review a protected attestor/source custody architecture and the owner-device signing UX. The owner must explicitly authorize adding actual trusted signing keys, secret-bearing workflows, service bindings, private content transfer or any write path. Do not invent a new “already trusted” source or ask for private key values in chat.
3. Keep P3-29 ingress and bridge hard-disabled with public URLs off; no D1 migrations or writes and no use of obsolete preflight. **Do not merge PR #263, deploy PWA, expose Worker routes or enable publishing.**
4. Next recommended **P3-42** is a source-only review of independent attestation issuance and trust-anchor rotation/revocation, including meaningful options for whether this *extra* attestor is necessary versus a simpler offline owner-held signer with direct independently authenticated content retrieval. Avoid additional credentials and complexity unless they measurably improve security. It is **not** approved to deploy an attestor, a signing device program or modify provider configuration.

The project-standard full new-chat handoff is still the five canonical public-main files (**README.md, Fishing_Context.md, Fishing_TODO.md, Fishing_Decision_Log.md, Fishing_New_Chat_Bootstrap_Prompt.md**) updated coherently only on an explicit transition. The user copies the **entire** Bootstrap prompt into the new chat; a terse summary is not a substitute.
