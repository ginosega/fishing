/**
 * FISH-TODO-118: source-only proposed D1 media metadata schema.
 * NO provider writes. Output only to a new local SQL file on explicit use.
 * Do not execute until owner has reviewed atomic Save and approved migration.
 */
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const D6_MEDIA_SCHEMA_SQL=[
 '-- Proposed V3 media metadata schema — NOT YET APPROVED FOR D1 EXECUTION.',
 '-- R2 staged bytes are NOT published or publicly readable by themselves.',
 '-- Existing Gear, KB, Catch tables and current media stay unchanged.',
 'CREATE TABLE IF NOT EXISTS d6_media_objects (',
 '  sha256 TEXT PRIMARY KEY CHECK(length(sha256)=64),',
 '  storage_key TEXT NOT NULL UNIQUE,',
 '  mime TEXT NOT NULL CHECK(mime IN (',
 "    'image/jpeg','image/png','image/webp','image/gif')),",
 '  bytes INTEGER NOT NULL CHECK(bytes>0 AND bytes<=10485760),',
 '  created_at INTEGER NOT NULL',
 ');',
 'CREATE TABLE IF NOT EXISTS d6_media_refs (',
 '  logical_path TEXT NOT NULL,',
 "  domain TEXT NOT NULL CHECK(domain IN ('gear','kb','catches')),",
 '  record_id TEXT NOT NULL,',
 '  sha256 TEXT NOT NULL REFERENCES d6_media_objects(sha256),',
 '  created_at INTEGER NOT NULL,',
 '  historical INTEGER NOT NULL DEFAULT 0 CHECK(historical IN (0,1)),',
 '  PRIMARY KEY(logical_path,domain,record_id)',
 ');',
 '-- A historical image can be used by more than one existing record.',
 '-- The same logical path must never map to different R2 byte digests.',
 'CREATE TRIGGER IF NOT EXISTS d6_media_same_path_sha BEFORE INSERT ON d6_media_refs',
 'WHEN EXISTS (SELECT 1 FROM d6_media_refs WHERE logical_path=NEW.logical_path',
 ' AND (sha256<>NEW.sha256 OR historical<>1 OR NEW.historical<>1))',
 ' BEGIN SELECT RAISE(ABORT, \'MEDIA_PATH_SHA_CONFLICT\'); END;',
 'CREATE INDEX IF NOT EXISTS d6_media_refs_path_idx',
 '  ON d6_media_refs(logical_path);',
 'CREATE INDEX IF NOT EXISTS d6_media_refs_owner_idx',
 '  ON d6_media_refs(domain,record_id);',
 '',
].join('\n');
async function main(){
 if(process.argv.length!==4||process.argv[2]!=='--out')
  throw Error('Usage: node tools/d6-media-schema.mjs --out <new-file.sql>');
 const target=path.resolve(process.argv[3]);
 await writeFile(target,D6_MEDIA_SCHEMA_SQL,{flag:'wx'});
 console.log('SOURCE ONLY: proposed media metadata SQL saved. NO D1 CHANGES.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(e=>{console.error(e.message);process.exitCode=1;});
