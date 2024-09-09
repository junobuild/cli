import {join} from 'node:path';

export const DEVELOPER_PROJECT_SRC_PATH = join(process.cwd(), 'src');
export const DEVELOPER_PROJECT_SATELLITE_PATH = join(DEVELOPER_PROJECT_SRC_PATH, 'satellite');
export const DEVELOPER_PROJECT_SATELLITE_DECLARATIONS_PATH = join(
  DEVELOPER_PROJECT_SRC_PATH,
  'declarations',
  'satellite'
);

export const TEMPLATE_PATH = '../templates/eject';
export const TEMPLATE_SATELLITE_PATH = join(TEMPLATE_PATH, 'src', 'satellite');

export const RUST_MIN_VERSION = '1.70.0';
export const IC_WASM_MIN_VERSION = '0.3.6';
export const DOCKER_MIN_VERSION = '24.0.0';
