# Dagger Axis 10.5 addition — release closeout

**Status: DEPLOYED / CLOSED.** Original addition September 8, 2026. FISH064 DONE. The subsequent user-confirmed length correction is also deployed under FISH065. See `RELEASE_2026-09-08_KAYAK_KB_IMAGES.md` for the latest evidence. The exact original closeout is preserved in `History/2026-09-08-pre-three-kb-images/pwa/DAGGER_AXIS_RELEASE_2026-09-08.md`.

## Original addition evidence

PR54 final head `bb13ca083b2f99c0fc6006ff7a1362b73f993912` passed normal CI #273 / `34187137697` against main `0f3107d8279ccca75ccb74f907391f370041c9e3`. Merge `0c07816b33c282cbc31e162812ad15c45d3a4bbe`; production #274 / `34187188334` succeeded including actual Pages deployment. PR55 closed the documentation. All 64 prior Gear records were preserved, with no migration or inferred relationship.

The original user package added Gear/media ID `dagger-axis-10-5`, category `accessories`, type `Kayaks`, manufacturer Dagger, model Axis 10.5, ordered specifications and manufacturer link. The original length was supplied as `12' 6"`. Original PNG blob `b6b9c96057adda124b7369952e851b13cf2f3b7b` was 563763 bytes. Its source path, explicit owner, destination and alt metadata were registered. No Notes were created. The original source remains in Git history. The concurrent Fishing Line image upload was preserved without inferred association.

The initial source-promotion runner was denied workflow-write permission. A source-only retry succeeded; the authorized connector updated the permanent CI workflow. Disposable executors were removed. No mandatory tests were bypassed.

## Confirmed correction and current image

The user confirmed Length `10' 6"`. PR56 corrected only that specification and advanced Gear dataVersion to `2026-09-08-my-gear-v4-dagger-length-1`, preserving the remaining fields, ordered link, ID, owner and no-Notes state. FISH065 is DONE. The new dataVersion refreshes seed-managed clients.

The user separately replaced `pwa/assets/gear-source/dagger-axis-10-5.png` on main at commit `5265a393cce601a59540de2a17f5b7c56b4d3535`. Current source blob `cfb44c09b6ab3d79a53d50e626664dde5e148a3a` is 259840 bytes. The current media ID, owner and destination are unchanged; external image origin is not inferred. The source and byte-identical built asset are validated by permanent tests.

PR56 head `d17d7b0c52955c06ef55659d6062e8b6f4a44759` passed normal CI #284 / `34188600391`; merge `531f04a84c0d75e2a7f23dc368149de5026b607b`; production #285 / `34188668110` succeeded including actual Pages deployment. Browser acceptance and independent HTTP verification remain separate. FISH063 remains the distinct KB filename-usability issue.

## Subsequent source replacement

The user replaced the PNG again in commit `2c79f685f5d3fc1020930874cfea486425840c3c`. Current source blob `cfb44c09b6ab3d79a53d50e626664dde5e148a3a` is 259840 bytes. The earlier replacement blob `17ad66ac19cc0a71f3ca4c3fd4ea6ec5e881ac51` and original blob remain in Git history. PR57 updates the regression to validate the actual image, existing stable owner and byte-identical transformed asset, rather than rejecting legitimate user-maintained image replacements. All product facts and the confirmed length remain unchanged.
