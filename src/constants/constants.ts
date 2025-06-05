export const CLI_PROJECT_NAME = process.env.CLI_PROJECT_NAME ?? 'juno';
export const CLI_SETTINGS_NAME = `${CLI_PROJECT_NAME}-cli-settings`;
export const REDIRECT_URL = 'http://localhost:{port}';
export const JUNO_CONFIG_FILENAME = 'juno.config'; // .json | .js | .mjs | .cjs | .ts
export const JUNO_DEV_CONFIG_FILENAME = 'juno.dev.config'; // .json | .js | .mjs | .cjs | .ts
export const SATELLITE_WASM_NAME = 'satellite';
export const MISSION_CONTROL_WASM_NAME = 'mission_control';
export const ORBITER_WASM_NAME = 'orbiter';
export const NODE_VERSION = 20;
export const JUNO_CDN_URL = 'https://cdn.juno.build';
export const GITHUB_API_CLI_URL = 'https://api.github.com/repos/junobuild/cli';

/**
 * Revoked principals that must not be used.
 *
 * @see https://forum.dfinity.org/t/agent-js-insecure-key-generation-in-ed25519keyidentity-generate/27732
 */
export const REVOKED_CONTROLLERS: string[] = [
  '535yc-uxytb-gfk7h-tny7p-vjkoe-i4krp-3qmcl-uqfgr-cpgej-yqtjq-rqe'
];
