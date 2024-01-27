import {green, grey, magenta, yellow} from 'kleur';
import {existsSync} from 'node:fs';
import {lstat, mkdir, rename, writeFile} from 'node:fs/promises';
import {join, relative} from 'node:path';
import ora, {type Ora} from 'ora';
import {DEVELOPER_PROJECT_SATELLITE_PATH, IC_WASM_MIN_VERSION} from '../constants/dev.constants';
import {execute, spawn} from '../utils/cmd.utils';
import {gzipFile} from '../utils/compress.utils';
import {
  checkCandidExtractorInstalled,
  checkIcWasmVersion,
  checkRustVersion
} from '../utils/env.utils';
import {confirmAndExit} from '../utils/prompt.utils';

const CARGO_RELEASE_DIR = join(process.cwd(), 'target', 'wasm32-unknown-unknown', 'release');
const DEPLOY_DIR = join(process.cwd(), 'target', 'deploy');
const SATELLITE_OUTPUT = join(DEPLOY_DIR, 'satellite.wasm');

export const build = async () => {
  const {valid: validRust} = await checkRustVersion();

  if (validRust === 'error' || !validRust) {
    return;
  }

  const {valid} = await checkIcWasm();

  if (!valid) {
    return;
  }

  const {valid: validExtractor} = await checkCandidExtractor();

  if (!validExtractor) {
    return;
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
    await did();

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

const SATELLITE_DID_FILE = join(DEVELOPER_PROJECT_SATELLITE_PATH, 'satellite.did');
const SATELLITE_CUSTOM_DID_FILE = join(DEVELOPER_PROJECT_SATELLITE_PATH, 'satellite_custom.did');

const did = async () => {
  let candid = '';
  await spawn({
    command: 'candid-extractor',
    args: [join(CARGO_RELEASE_DIR, 'satellite.wasm')],
    stdout: (o) => (candid += o)
  });

  // TODO
  const empty = candid.replace(/(\r\n|\n|\r)/gm, "").trim() === '';

  if (empty) {
    return;
  }

  await writeFile(SATELLITE_CUSTOM_DID_FILE, candid, 'utf-8');
};

const icWasm = async () => {
  await mkdir(DEPLOY_DIR, {recursive: true});

  // Remove unused functions and debug info.
  await spawn({
    command: 'ic-wasm',
    args: [join(CARGO_RELEASE_DIR, 'satellite.wasm'), '-o', SATELLITE_OUTPUT, 'shrink']
  });

  // Adds the content of satellite.did to the `icp:public candid:service` custom section of the public metadata in the wasm
  await spawn({
    command: 'ic-wasm',
    args: [
      SATELLITE_OUTPUT,
      '-o',
      SATELLITE_OUTPUT,
      'metadata',
      'candid:service',
      '-f',
      SATELLITE_DID_FILE,
      '-v',
      'public'
    ]
  });

  // Indicate support for certificate version 1 and 2 in the canister metadata
  await spawn({
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

const checkIcWasm = async (): Promise<{valid: boolean}> => {
  const {valid} = await checkIcWasmVersion();

  if (valid === false) {
    return {valid};
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

  return {valid: true};
};

const checkCandidExtractor = async (): Promise<{valid: boolean}> => {
  const {valid} = await checkCandidExtractorInstalled();

  if (valid === false) {
    return {valid};
  }

  if (valid === 'error') {
    await confirmAndExit(
      `The ${magenta(
        'candid-extractor'
      )} tool is required to generate the API ("did file") of your custom satellite but appears to be not available. Would you like to install it on your machine?`
    );

    await execute({
      command: 'cargo',
      args: ['install', `candid-extractor`]
    });
  }

  return {valid: true};
};
