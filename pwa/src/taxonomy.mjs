// Compile-time standalone V3 selection. Historical source fixtures use the
// archived taxonomy only in nonstandalone builds/tests; no content conversion.
export const NORMALIZED_V3=typeof __FISHING_D6_STANDALONE_V3__!=='undefined'&&__FISHING_D6_STANDALONE_V3__===true;
export const GEAR_EQUIPMENT=NORMALIZED_V3?'equipment':'accessories';
export const KB_LOCATIONS=NORMALIZED_V3?'locations':'location';
export const KB_GUIDES=NORMALIZED_V3?'gear-guides':'equipment';
export const KB_TECHNIQUES=NORMALIZED_V3?'techniques':'technique';
export const KB_KNOTS=NORMALIZED_V3?'knots':'knot';
