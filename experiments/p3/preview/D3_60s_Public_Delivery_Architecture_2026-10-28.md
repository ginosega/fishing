# FISH118 D3 — 60-second public delivery architecture and evidence contract
Date: October 28, 2026. SOURCE-ONLY feasibility work on open draft PR #263.
**No public V3 release, GitHub App privilege change, Worker deployment, or
routing/hosting/cost authorization is implied.** The October 19 approved design
and October 27 V3-SAVE-09 amendment control.

## Verified current baseline and hard gate

The existing nine successful content-only `main` Pages Action samples took
**85, 95, 99, 99, 100, 117, 138, 164, 183 seconds**, respectively, from
Actions-run creation to independent hosted verification. Those timings
**exclude** the owner click, POST acceptance, PR preparation, exact-head CI,
and protected merge. Source:
[D3 acceptance/performance report](D3_Acceptance_And_60s_Delivery_Evidence_2026-10-28.md).
Thus the present pipeline fails the strict 60-second requirement in all nine
samples *even before counting upstream work*. These data do **not** prove an
optimized alternate Pages lane is impossible.

Existing D3 sandbox Live includes private PR/CI/merge/host proof; **it is not
public canonical Live**. The current five-minute Cron can remain as a durable
recovery-only mechanism, but cannot be the main driver. Moving to event-driven
progression removes scheduling idle time, **not** the observed Pages latency.

## Delivery alternatives — keep both isolated until independently benchmarked

**A. Minimized GitHub Pages content lane.** Prototype an exact-head,
content-only validated and protected normal merge followed by a reduced
Pages deployment and byte/release verifier. Keep required canonical source
validation, branch rules, public host byte comparison and failure recovery.
Measure repeated real end-to-end runs including Actions queue/deploy latency.
Do not call this compliant based on CI duration alone.

**B. Same-origin versioned verified-content lane (leading feasibility
candidate, NOT selected for deployment).** After GitHub App owner authorization,
source-aware validation, protected exact-head CI and ordinary merge, obtain
the precise canonical public `main` commit/tree/blobs. Stage only the resulting
allowed content bytes to **immutable commit-addressed version paths**. Verify
staged byte digests and Git lineage; atomically move a single version pointer
only when the complete manifest and referenced content are present. Serve
both the release manifest and Gear/KB/Catch data through one same-origin
gateway pinned to a version, and independently GET the *public* canonical
endpoints before transitioning D1 to Live. Preserve the previous generation
for rollback, old clients and offline snapshot coherence.

Potential storage primitives need separate evaluation and approval:
Cloudflare **R2** documents globally strongly consistent object
read-after-write and conditional create-once, but its caching warning means
versioned URLs with unshared immutable keys and explicit Worker-binding reads
are preferable to a mutable publicly cached path:
https://developers.cloudflare.com/r2/reference/consistency/
Cloudflare **Workers KV** explicitly allows stale cross-region reads for
60 seconds or more and is **not** suitable as the authoritative atomic
release pointer:
https://developers.cloudflare.com/kv/concepts/how-kv-works/
A D1 primary transaction or SQLite-backed Durable Object may be eligible
for the pointer, with explicit read-consistency and lineage checks;
do not assume unbookmarked read replicas are immediately current:
https://developers.cloudflare.com/d1/best-practices/read-replication/

Cloudflare Workers Free has a documented 10ms CPU budget per invocation,
and `ctx.waitUntil()` work is capped at **30 seconds after response**:
https://developers.cloudflare.com/workers/platform/limits/
https://developers.cloudflare.com/workers/runtime-apis/context/
Therefore do not implement an unbounded post-response polling loop as a
reliable 60-second publisher. Evaluate verified event triggers, a bounded
immediate worker step and a durable recovery mechanism *without enabling*
new queue, webhook, storage, origin, or paid service yet.

## Required measured critical path

Instrument a **single-clock monotonic** owner's Save click → independent
public URL GET plus hosted byte/release/source proof; distinguish from
separate server UTC stage times. Capture no session cookie, CSRF, App PEM,
private token, draft payload or personal identifiers.

Record bounded nonsecret timings/stage references for: click, durable
Accepted receipt, immutable validation and draft PR, exact-head CI success,
protected normal merge SHA, complete immutable content stage, public version
activation, and independent public read SHA/release proof. Error/unknown
network results must never be auto-resubmitted under a different key.
Only the final verified public proof ends the clock. Normal Actions queue,
Pages propagation and provider latency are **not** outage waivers.
Independently documented provider outages require separate review.

The source-only
[`d3-delivery-latency-gate.mjs`](src/d3-delivery-latency-gate.mjs)
grades supplied evidence and the 60,000ms boundary; it **does not** authenticate
evidence or perform HTTP/GitHub verification. Its source tests cover the nine
historical lower bounds, missing public proof, all three content domains,
the inclusive deadline and nonautomatic outage handling. A future test
harness must supply real independent evidence from trusted instrumentation.

## Benchmark and stop conditions

For each of Gear, KB and Catch, perform repeated **normal text-only**
Save-and-Publish runs measured from genuine owner click. A run passes
only if the public, canonical, protected-merge-derived bytes and release
identity have been independently verified in **60,000ms or less**.
Include bad base/conflict, missing/late check, lost POST acknowledgement,
ambiguous merge, resumed lease, cross-region stale read, asset race and
rollback tests separately. No synthetic private sandbox release can pass
the public acceptance criterion.

Any new storage service, Worker public routing, schema/permission/cost
change, production source mutation or final public V3 cutover requires its
own consequential owner approval. Until then keep V2 Pages unchanged,
draft #262/#263 unmerged, PR #268 untouched and private pilot isolated.
