/** Standalone V3 does not read GitHub main as an authoring database. */
export const D6_CANONICAL_REPOSITORY=Object.freeze({
 id:1350909744,fullName:'ginosega/fishing',ref:'refs/heads/main',
});
export function createD6CanonicalSourceClient(){
 throw Error('V3_LEGACY_GITHUB_AUTHORING_SOURCE_DISABLED');
}
