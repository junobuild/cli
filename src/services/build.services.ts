import {green, grey, magenta, yellow} from 'kleur';
import {existsSync} from 'node:fs';
import {lstat, mkdir, rename} from 'node:fs/promises';
import {join, relative} from 'node:path';
import ora, {type Ora} from 'ora';
import {IC_WASM_MIN_VERSION} from '../constants/constants';
import {execute} from '../utils/cmd.utils';
import {gzipFile} from '../utils/compress.utils';
import {checkIcWasmVersion} from '../utils/env.utils';
import {confirmAndExit} from '../utils/prompt.utils';

const CARGO_RELEASE_DIR = join(process.cwd(), 'target', 'wasm32-unknown-unknown', 'release');
const DEPLOY_DIR = join(process.cwd(), 'target', 'deploy');
const SATELLITE_OUTPUT = join(DEPLOY_DIR, 'satellite.wasm');

export const build = async () => {
  const {valid} = await checkIcWasmVersion();

  if (valid === false) {
    return;
  }

  if (valid === 'error') {
    await confirmAndExit(
      `The ${magenta('ic-wasm')} ${yellow(
        `v${IC_WASM_MIN_VERSION}`
      )} tool is required to build a satellite but appears to be not available. Would you like to install it on your machine?`
    );

    await execute({
      command: 'cargo',
      args: ['install', `ic-wasm@${IC_WASM_MIN_VERSION}`]
    });
  }

  const args = [
    'build',
    '--target',
    'wasm32-unknown-unknown',
    '-p',
    'satellite',
    '--release',
    ...(existsSync('Cargo.lock') ? ['--locked'] : [])
  ];

  await execute({
    command: 'cargo',
    args
  });

  const spinner = ora({
    text: 'Finalizing...',
    discardStdin: true
  }).start();

  try {
    await icWasm();

    spinner.text = 'Compressing...';

    // We use a temporary file otherwise the automatic deployment in Docker may start with a file that is not yet fully gzipped
    await gzipFile({source: SATELLITE_OUTPUT, destination: `${SATELLITE_OUTPUT}.tmp.gz`});

    await rename(`${SATELLITE_OUTPUT}.tmp.gz`, `${SATELLITE_OUTPUT}.gz`);

    await successMsg(spinner);
  } finally {
    spinner.stop();
  }
};

const icWasm = async () => {
  await mkdir(DEPLOY_DIR, {recursive: true});

  // Remove unused functions and debug info.
  await execute({
    command: 'ic-wasm',
    args: [join(CARGO_RELEASE_DIR, 'satellite.wasm'), '-o', SATELLITE_OUTPUT, 'shrink']
  });

  // Adds the content of satellite.did to the `icp:public candid:service` custom section of the public metadata in the wasm
  // TODO

  // Indicate support for certificate version 1 and 2 in the canister metadata
  await execute({
    command: 'ic-wasm',
    args: [
      SATELLITE_OUTPUT,
      '-o',
      SATELLITE_OUTPUT,
      'metadata',
      'supported_certificate_versions',
      '-d',
      '"1,2"',
      '-v',
      'public'
    ]
  });
};

const successMsg = async (spinner: Ora) => {
  const gzipOutput = `${SATELLITE_OUTPUT}.gz`;
  const {size} = await lstat(gzipOutput);

  const formatMB = (value: number): string =>
    Intl.NumberFormat('en-US', {
      maximumSignificantDigits: 2
    }).format(value / (1024 * 1024));

  spinner.succeed(
    `${green('Success!')}\n\nThe satellite has been compiled.\nOutput file: ${yellow(
      `${relative(process.cwd(), gzipOutput)}`
    )} ${grey(`(${formatMB(size)}MB)`)}`
  );
};
