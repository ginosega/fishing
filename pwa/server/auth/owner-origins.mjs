// Exact trusted V3 origins; no Pages or repository access.
export const D6_PRODUCTION_ORIGIN='https://fishing.ginosega.workers.dev';
export const D6_PRIVATE_ORIGIN='https://fishing-d6-wp2-test.ginosega.workers.dev';
export const isD6OwnerOrigin=origin=>origin===D6_PRODUCTION_ORIGIN||origin===D6_PRIVATE_ORIGIN;
