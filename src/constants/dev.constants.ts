import {join} from 'node:path';

export const DEVELOPER_PROJECT_SRC_PATH = join(process.cwd(), 'src');
export const DEVELOPER_PROJECT_SATELLITE_PATH = join(DEVELOPER_PROJECT_SRC_PATH, 'satellite');
export const DEVELOPER_PROJECT_SATELLITE_DECLARATIONS_PATH = join(
  DEVELOPER_PROJECT_SRC_PATH,
  'declarations',
  'satellite'
);

export const CARGO_TOML = 'Cargo.toml';
export const INDEX_TS = 'index.ts';
export const INDEX_MJS = 'index.mjs';

export const DEVELOPER_PROJECT_SATELLITE_CARGO_TOML = join(
  DEVELOPER_PROJECT_SATELLITE_PATH,
  CARGO_TOML
);
export const DEVELOPER_PROJECT_SATELLITE_INDEX_TS = join(
  DEVELOPER_PROJECT_SATELLITE_PATH,
  'index.ts'
);
export const DEVELOPER_PROJECT_SATELLITE_INDEX_MJS = join(
  DEVELOPER_PROJECT_SATELLITE_PATH,
  'index.mjs'
);

const TEMPLATE_PATH = '../templates/eject';

export const RUST_TEMPLATE_PATH = join(TEMPLATE_PATH, 'rust');
export const RUST_TEMPLATE_SATELLITE_PATH = join(RUST_TEMPLATE_PATH, 'src', 'satellite');

export const TS_TEMPLATE_PATH = join(TEMPLATE_PATH, 'typescript');
export const MJS_TEMPLATE_PATH = join(TEMPLATE_PATH, 'javascript');

export const RUST_MIN_VERSION = '1.70.0';
export const IC_WASM_MIN_VERSION = '0.8.5';
export const DOCKER_MIN_VERSION = '24.0.0';

export const TARGET_PATH = join(process.cwd(), 'target');
export const DEPLOY_LOCAL_REPLICA_PATH = join(TARGET_PATH, 'deploy');
export const JUNO_PACKAGE_JSON_PATH = join(TARGET_PATH, 'juno.package.json');

export const PACKAGE_JSON_PATH = join(process.cwd(), 'package.json');

export const SPUTNIK_INDEX_MJS = 'sputnik.index.mjs';
export const DEPLOY_SPUTNIK_PATH = join(DEPLOY_LOCAL_REPLICA_PATH, SPUTNIK_INDEX_MJS);

export const JUNO_ACTION_SPUTNIK_PATH = '/juno/src/sputnik';
export const SPUTNIK_CARGO_TOML = join(JUNO_ACTION_SPUTNIK_PATH, CARGO_TOML);

export const SATELLITE_OUTPUT = join(DEPLOY_LOCAL_REPLICA_PATH, 'satellite.wasm');
