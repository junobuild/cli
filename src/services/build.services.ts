import {execute, gzipFile, spawn} from '@junobuild/cli-tools';
import {generateApi} from '@junobuild/did-tools';
import {green, grey, magenta, yellow} from 'kleur';
import {existsSync} from 'node:fs';
import {lstat, mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import {join, relative} from 'node:path';
import ora, {type Ora} from 'ora';
import {detectJunoDevConfigType} from '../configs/juno.dev.config';
import {
  DEVELOPER_PROJECT_SATELLITE_DECLARATIONS_PATH,
  DEVELOPER_PROJECT_SATELLITE_PATH,
  IC_WASM_MIN_VERSION
} from '../constants/dev.constants';
import {copySatelliteDid, readSatelliteDid} from '../utils/did.utils';
import {checkCargoBinInstalled, checkIcWasmVersion, checkRustVersion} from '../utils/env.utils';
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

  const {valid: validDidc} = await checkJunoDidc();

  if (!validDidc) {
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
    await didc();
    await api();

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
const EXTENSION_DID_FILE_NAME = 'satellite_extension.did';
const SATELLITE_CUSTOM_DID_FILE = join(DEVELOPER_PROJECT_SATELLITE_PATH, EXTENSION_DID_FILE_NAME);

const did = async () => {
  let candid = '';
  await spawn({
    command: 'candid-extractor',
    args: [join(CARGO_RELEASE_DIR, 'satellite.wasm')],
    stdout: (o) => (candid += o)
  });

  const empty = candid.replace(/(\r\n|\n|\r)/gm, '').trim() === '';

  if (empty) {
    // We always overwrite the satellite did file provided by Juno. That way we are sure the did file is always correct.
    await copySatelliteDid(true);

    return;
  }

  await writeFile(SATELLITE_CUSTOM_DID_FILE, candid, 'utf-8');

  const templateDid = await readSatelliteDid();
  await writeFile(
    SATELLITE_DID_FILE,
    `import service "${EXTENSION_DID_FILE_NAME}";\n\n${templateDid}`,
    'utf-8'
  );
};

const satellitedIdl = (type: 'js' | 'ts'): string =>
  `${DEVELOPER_PROJECT_SATELLITE_DECLARATIONS_PATH}/satellite.${type === 'ts' ? 'did.d.ts' : 'factory.did.js'}`;

const didc = async () => {
  // No satellite_extension.did and therefore no services to generate to JS and TS.
  if (!existsSync(SATELLITE_CUSTOM_DID_FILE)) {
    return;
  }

  // We check if the developer has added any API endpoints. If none, we do not need to generate the bindings for JS and TS.
  const extensionDid = await readFile(SATELLITE_CUSTOM_DID_FILE, 'utf-8');
  const noAdditionalExtensionDid = 'service : { build_version : () -> (text) query }';

  if (extensionDid.trim() === noAdditionalExtensionDid) {
    return;
  }

  const generate = async (type: 'js' | 'ts') => {
    await spawn({
      command: 'junobuild-didc',
      args: ['-i', SATELLITE_CUSTOM_DID_FILE, '-t', type, '-o', satellitedIdl(type)]
    });
  };

  const promises = (['js', 'ts'] as Array<'js' | 'ts'>).map(generate);

  await Promise.all(promises);
};

const api = async () => {
  const inputFile = satellitedIdl('ts');

  if (!existsSync(inputFile)) {
    return;
  }

  const detectedConfig = detectJunoDevConfigType();
  const outputLanguage = detectedConfig?.configType === 'ts' ? 'ts' : 'js';

  const outputFile = `${DEVELOPER_PROJECT_SATELLITE_DECLARATIONS_PATH}/satellite.api.${outputLanguage}`;

  const readCoreLib = async (): Promise<'core' | 'core-peer'> => {
    try {
      const packageJson = await readFile(join(process.cwd(), 'package.json'), 'utf-8');
      const {dependencies} = JSON.parse(packageJson) as {dependencies?: Record<string, string>};
      return Object.keys(dependencies ?? {}).includes('@junobuild/core-peer')
        ? 'core-peer'
        : 'core';
    } catch (err: unknown) {
      // This should not block the developer therefore we fallback to core
      return 'core';
    }
  };

  const coreLib = await readCoreLib();

  await generateApi({
    inputFile,
    outputFile,
    transformerOptions: {
      outputLanguage,
      coreLib
    }
  });
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

  // Add the type of build "extended" to the satellite. This way, we can identify whether it's the standard canister ("stock") or a custom build of the developer.
  await spawn({
    command: 'ic-wasm',
    args: [
      SATELLITE_OUTPUT,
      '-o',
      SATELLITE_OUTPUT,
      'metadata',
      'juno:build',
      '-d',
      'extended',
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
      )} tool is required to build a satellite but appears to be not available. Would you like to install it?`
    );

    await execute({
      command: 'cargo',
      args: ['install', `ic-wasm@${IC_WASM_MIN_VERSION}`]
    });
  }

  return {valid: true};
};

const checkCandidExtractor = async (): Promise<{valid: boolean}> => {
  const {valid} = await checkCargoBinInstalled({
    command: 'candid-extractor',
    args: ['--version']
  });

  if (valid === false) {
    return {valid};
  }

  if (valid === 'error') {
    await confirmAndExit(
      `The ${magenta(
        'candid-extractor'
      )} tool is required to generate the API ("did file"). Would you like to install it?`
    );

    await execute({
      command: 'cargo',
      args: ['install', 'candid-extractor']
    });
  }

  return {valid: true};
};

const checkJunoDidc = async (): Promise<{valid: boolean}> => {
  const {valid} = await checkCargoBinInstalled({
    command: 'junobuild-didc',
    args: ['--version']
  });

  if (valid === false) {
    return {valid};
  }

  if (valid === 'error') {
    await confirmAndExit(
      `It seems that ${magenta(
        'junobuild-didc'
      )} is not installed. This is a useful tool for generating automatically JavaScript or TypeScript bindings. Would you like to install it?`
    );

    await execute({
      command: 'cargo',
      args: ['install', `junobuild-didc`]
    });
  }

  return {valid: true};
};
