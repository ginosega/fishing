# Dagger Axis 10.5 addition — release closeout

**Status: DEPLOYED / CLOSED.** September 8, 2026. FISH-TODO-064 DONE. User browser acceptance remains separate; no independent live HTTP response is claimed.

## Release evidence

- PR54: https://github.com/ginosega/fishing/pull/54
- Final feature head: `bb13ca083b2f99c0fc6006ff7a1362b73f993912`.
- Normal PR CI: #273 / `34187137697`, success against main `0f3107d8279ccca75ccb74f907391f370041c9e3`.
- Merge: `0c07816b33c282cbc31e162812ad15c45d3a4bbe`.
- Production: #274 / `34187188334`, success. All existing and new model, routing, authoring, media and content tests passed, followed by build, authored-Notes materialization, local-media materialization, final transformed-bundle validation, exact Dagger image-byte verification, artifact uploads and the actual Deploy to GitHub Pages step.
- Production workflow: https://github.com/ginosega/fishing/actions/runs/34187188334
- Live site: https://ginosega.github.io/fishing/

## Scope and source preservation

The user-authorized add package was promoted as Gear ID and media ID `dagger-axis-10-5`, category `accessories`, type `Kayaks`. The exact submitted name, manufacturer, model, ordered specifications and manufacturer link are preserved. No Notes were created. Gear remains schema4, with 65 source records and dataVersion `2026-09-08-my-gear-v4-dagger-axis-1`. KB schema1/54 entities and Catch schema2/five historical records remain unchanged. All 64 existing Gear records, IDs, facts, ownership and Notes are retained. No migration, speculative relationship or Catch attribution was introduced.

The uploaded source is `pwa/assets/gear-source/dagger-axis-10-5.png`, Git blob `b6b9c96057adda124b7369952e851b13cf2f3b7b`, 563763 bytes. Actual PNG format, extension and size were validated. The source is registered under its stable media ID with explicit owner `dagger-axis-10-5`, sourcePage/destination equal to the submitted manufacturer URL, and alt `Dagger Axis 10.5 crossover kayak`. The external origin of the uploaded PNG is not inferred. The existing local-media pipeline copies exact bytes without recompression to `./assets/gear/dagger-axis-10-5.png` and includes the media in the offline bundle. The final-bundle test verifies exact source and built bytes, media identity, owner, sourcePath and localSource. No prior source image was deleted.

During this release, the user independently uploaded `pwa/assets/kb/entries/technique-fishing-line.jpg` on main `0f3107d8279ccca75ccb74f907391f370041c9e3`, blob `6bbf79095fb60cda21ea086553a1ec3bf64132cb`. That direct-main addition was preserved in the final feature merge and production. It was not registered to an unrelated KB entry or assigned ownership by inference.

## Verification, cleanup and open facts

The initial source-promotion runner validated the data but was denied permission to update the CI workflow. The permission was respected: a source-only retry succeeded, and the authorized GitHub connector committed the permanent CI changes separately. Both disposable promotion workflows were removed before PR54 CI. No one-time migration was rerun. Permanent Dagger source and final-bundle regression gates remain in the standard workflow; no test was bypassed.

The submitted Length `12' 6"` appears inconsistent with the Axis 10.5 model designation. It remains verbatim in the deployed record. FISH-TODO-065 is WAITING ON USER to confirm the actual length; do not silently substitute an assumed value. The existing FISH-TODO-063 filename-usability issue remains OPEN and is unrelated to this addition.

The authoritative README, Context, TODO, Decision Log, PWA README and bootstrap have been reconciled through the documentation closeout. Their exact pre-addition versions are preserved under `History/2026-09-08-pre-dagger-addition/` and in Git history. The deployment is complete; no application release remains pending. Documentation closeout PR55 is administrative and does not introduce another application change.
