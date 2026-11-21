-- Single unchanged Gear seed taken from existing immutable main source.
-- Main Gear blob: 741ba8f19c06834eb6e92fea84404fdb2ac58f88
-- Main Notes blob: 9758d4ca90b66f2057678d4d64e3583435187997
-- Scope: one pre-existing Gear item, no source/V2 mutation.
-- Does not overwrite an already seeded record.
INSERT INTO d6_gear_records(id,revision,record_json,notes_text,updated_at)
VALUES(
 'daiwa-tatula-xt-rod',
 1,
 '{"id":"daiwa-tatula-xt-rod","category":"rods-reels","type":"Spinning rod","name":"Daiwa Tatula XT","manufacturer":"Daiwa","model":"Tatula XT","specifications":[{"label":"Length","value":"7''"},{"label":"Power","value":"Medium"},{"label":"Action","value":"Fast"},{"label":"Pieces","value":"2"},{"label":"Part","value":"TATULAXT702MFS"}],"links":[{"label":"Daiwa","url":"https://daiwa.us/collections/freshwater-rods/products/tatula-xt"},{"label":"Tackle Warehouse","url":"https://www.tacklewarehouse.com/Daiwa_Tatula_XT_Spinning_Rods_2-Piece/descpage-NTXT2S.html"}],"notes":"Gear/Rods-Reels/content/Daiwa Tatula XT.md","picture":{"src":"Gear/Rods-Reels/assets/daiwa-tatula-xt.webp"}}',
 'Primary finesse / trout / Jacob-friendly setup.

Current line: [Sufix 832 15 lb Hi-Vis Yellow](gear://sufix-832-15) braid with [Seaguar InvizX 8 lb](gear://seaguar-invizx-8) fluorocarbon leader.

Best suited to lighter presentations such as wacky worms, drop shots, Ned rigs, small jerkbaits, inline spinners, and spoons. Also preferred when easy casting, light-line control, or clear-water finesse is more important than power.

See [Rods & Reels](kb://technique-rods-reels) for general spinning-vs-baitcasting guidance and typical spinning setup recommendations.
',
 CAST(strftime('%s','now') AS INTEGER)
) ON CONFLICT(id) DO NOTHING;
