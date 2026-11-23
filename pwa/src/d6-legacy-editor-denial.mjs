/** L01 — standalone V3 must never enter the V2 GitHub handoff editor. */
export async function createEditor(){
 throw Error('V3_LEGACY_GITHUB_AUTHORING_DISABLED');
}
