export const DEPLOY_DEFAULT_SOURCE = 'build';
export const DEPLOY_DEFAULT_IGNORE = [];
export const DEPLOY_DEFAULT_ENCODING = [];
export const DEPLOY_DEFAULT_GZIP = '**/*.+(css|js|mjs)';

export const MEMORY_SIZE_ENDPOINT_VERSION = '0.0.14';
export const MEMORY_HEAP_WARNING = 900_000_000n;

// Observed empirical value, the threshold might be higher, but at the time I wrote this, pagination there were a bit more than 700 files deployed on the Juno website without any issues.
export const DEPLOY_LIST_ASSETS_PAGINATION = 500;
