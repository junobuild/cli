export const AUTH_URL = `${process.env.JUNO_URL}/cli`;
export const CLI_PROJECT_NAME = process.env.CLI_PROJECT_NAME;
export const REDIRECT_URL = 'http://localhost:{port}';
export const JUNO_CONFIG_FILENAME = 'juno.config'; // .json | .js | .mjs | .cjs | .ts
export const JUNO_DEV_CONFIG_FILENAME = 'juno.dev.config'; // .json | .js | .mjs | .cjs | .ts
/**
 * @deprecated juno.json is deprecated but still supported. We are now using juno.config.xxx
 */
export const JUNO_JSON = 'juno.json';
/**
 * @deprecated juno.dev.json is deprecated but still supported. We are now using juno.dev.config.xxx
 */
export const JUNO_DEV_JSON = 'juno.dev.json';
export const DAPP_COLLECTION = '#dapp';
export const SATELLITE_WASM_NAME = 'satellite';
export const MISSION_CONTROL_WASM_NAME = 'mission_control';
export const ORBITER_WASM_NAME = 'orbiter';
export const UPLOAD_BATCH_SIZE = 20;
export const COLLECTION_DAPP = '#dapp';
export const NODE_18 = 18;
export const CONSOLE_URL = 'https://console.juno.build';
export const CONSOLE_SATELLITE_URL = `${CONSOLE_URL}/satellite/?s=`;
export const JUNO_CDN_URL = 'https://cdn.juno.build';
export const GITHUB_API_CLI_URL = 'https://api.github.com/repos/junobuild/cli';
export const IGNORE_OS_FILES = ['.ds_store', 'thumbs.db'];

/**
 * Revoked principals that must not be used.
 *
 * @see https://forum.dfinity.org/t/agent-js-insecure-key-generation-in-ed25519keyidentity-generate/27732
 */
export const REVOKED_CONTROLLERS: string[] = [
  '535yc-uxytb-gfk7h-tny7p-vjkoe-i4krp-3qmcl-uqfgr-cpgej-yqtjq-rqe'
];
