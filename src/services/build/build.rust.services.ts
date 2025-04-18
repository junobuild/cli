import {isEmptyString, isNullish, nonNullish} from '@dfinity/utils';
import {execute, gzipFile, spawn} from '@junobuild/cli-tools';
import {type JunoPackage} from '@junobuild/config';
import {generateApi} from '@junobuild/did-tools';
import {magenta, red, yellow} from 'kleur';
import {existsSync} from 'node:fs';
import {lstat, mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import {join, relative} from 'node:path';
import ora, {type Ora} from 'ora';
import {compare, satisfies} from 'semver';
import {detectJunoDevConfigType} from '../../configs/juno.dev.config';
import {
  DEPLOY_LOCAL_REPLICA_PATH,
  DEVELOPER_PROJECT_SATELLITE_DECLARATIONS_PATH,
  DEVELOPER_PROJECT_SATELLITE_PATH,
  IC_WASM_MIN_VERSION,
  JUNO_PACKAGE_JSON_PATH,
  TARGET_PATH
} from '../../constants/dev.constants';
import type {BuildArgs} from '../../types/build';
import {readSatelliteDid} from '../../utils/did.utils';
import {checkCargoBinInstalled, checkIcWasmVersion, checkRustVersion} from '../../utils/env.utils';
import {formatBytes, formatTime} from '../../utils/format.utils';
import {readPackageJson} from '../../utils/pkg.utils';
import {confirmAndExit} from '../../utils/prompt.utils';

const CARGO_RELEASE_DIR = join(process.cwd(), 'target', 'wasm32-unknown-unknown', 'release');
const SATELLITE_OUTPUT = join(DEPLOY_LOCAL_REPLICA_PATH, 'satellite.wasm');
const SATELLITE_PROJECT_NAME = 'satellite';

export const buildRust = async ({path}: Pick<BuildArgs, 'path'> = {}) => {
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

  const defaultProjectArgs = ['-p', SATELLITE_PROJECT_NAME];

  const args = [
    'build',
    '--target',
    'wasm32-unknown-unknown',
    ...(nonNullish(path) ? ['--manifest-path', path] : defaultProjectArgs),
    '--release',
    ...(existsSync('Cargo.lock') ? ['--locked'] : [])
  ];

  const env = {...process.env, RUSTFLAGS: '--cfg getrandom_backend="custom"'};

  await execute({
    command: 'cargo',
    args,
    env
  });

  const spinner = ora({
    text: 'Finalizing...',
    discardStdin: true
  }).start();

  try {
    const buildType = await extractBuildType({path});

    if ('error' in buildType) {
      console.log(red(buildType.error));
      return;
    }

    await prepareJunoPkg({buildType});

    await did();
    await didc();
    await api();

    await icWasm({buildType});

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

const AUTO_GENERATED = `// This file was automatically generated by the Juno CLI.
// Any modifications may be overwritten.`;

const did = async () => {
  let candid = '';
  await spawn({
    command: 'candid-extractor',
    args: [join(CARGO_RELEASE_DIR, 'satellite.wasm')],
    stdout: (o) => (candid += o)
  });

  const empty = candid.replace(/(\r\n|\n|\r)/gm, '').trim() === '';

  const templateDid = await readSatelliteDid();

  if (empty) {
    // We always overwrite the satellite did file provided by Juno. That way we are sure the did file is always correct.
    await writeFile(SATELLITE_DID_FILE, `${AUTO_GENERATED}\n\n${templateDid}`, 'utf-8');

    return;
  }

  await writeFile(SATELLITE_CUSTOM_DID_FILE, `${AUTO_GENERATED}\n\n${candid}`, 'utf-8');

  await writeFile(
    SATELLITE_DID_FILE,
    `${AUTO_GENERATED}\n\nimport service "${EXTENSION_DID_FILE_NAME}";\n\n${templateDid}`,
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
    const output = satellitedIdl(type);

    await spawn({
      command: 'junobuild-didc',
      args: ['-i', SATELLITE_CUSTOM_DID_FILE, '-t', type, '-o', output]
    });

    const content = await readFile(output, 'utf-8');

    // Depending on the `tsconfig`, the `factory.did.js` file might be validated.
    // Cleaning the file prevents errors such as:
    // TS7031: Binding element 'IDL' implicitly has an 'any' type.
    const cleanJs = (content: string): string => {
      const cleanFactory = content.replace(
        /export const idlFactory = \({ IDL }\) => {/g,
        `// @ts-expect-error
export const idlFactory = ({ IDL }) => {`
      );
      return cleanFactory.replace(
        /export const init = \({ IDL }\) => {/g,
        `// @ts-expect-error
export const init = ({ IDL }) => {`
      );
    };

    const cleanedContent = type === 'js' ? cleanJs(content) : content;

    await writeFile(output, `${AUTO_GENERATED}\n\n${cleanedContent}`);
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

  const readCoreLib = async (): Promise<'core' | 'core-standalone'> => {
    try {
      const {dependencies} = await readPackageJson();
      return Object.keys(dependencies ?? {}).includes('@junobuild/core-standalone')
        ? 'core-standalone'
        : 'core';
    } catch (_err: unknown) {
      // This should not block the developer therefore we fallback to core which is the common way of using the library
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

type BuildType = {build: 'legacy'} | {build: 'modern'; version: string; satelliteVersion: string};

const prepareJunoPkg = async ({buildType}: {buildType: BuildType}) => {
  // We do not write a juno.package.json for legacy build
  if (buildType.build === 'legacy') {
    return;
  }

  const {version, satelliteVersion} = buildType;

  const pkg: JunoPackage = {
    version,
    name: SATELLITE_PROJECT_NAME,
    dependencies: {
      '@junobuild/satellite': satelliteVersion
    }
  };

  await writeFile(JUNO_PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2), 'utf-8');
};

const extractBuildType = async ({path}: Pick<BuildArgs, 'path'> = {}): Promise<
  BuildType | {error: string}
> => {
  await mkdir(TARGET_PATH, {recursive: true});

  const manifestArgs = nonNullish(path) ? ['--manifest-path', path] : [];

  let output = '';
  await spawn({
    command: 'cargo',
    args: ['metadata', '--format-version', '1', ...manifestArgs],
    stdout: (o) => (output += o)
  });

  const metadata = JSON.parse(output);

  const satellitedPkg = (metadata?.packages ?? []).find(
    (pkg) => pkg?.name === SATELLITE_PROJECT_NAME
  );

  const version: string | null | undefined = satellitedPkg?.version;

  if (isNullish(version) || isEmptyString(version)) {
    return {
      error: 'No version specified. Please add one to the Cargo.toml file of your Satellite.'
    };
  }

  const satDependency: {req?: string | null | undefined} = (satellitedPkg?.dependencies ?? []).find(
    ({name}) => name === 'junobuild-satellite'
  );

  if (isNullish(satDependency)) {
    return {error: 'No Satellite dependency. Your project is not a Satellite.'};
  }

  const {req: requiredSatVersion} = satDependency;

  if (isNullish(requiredSatVersion) || isEmptyString(requiredSatVersion)) {
    return {error: 'Cannot determine which junobuild-satellite dependency version is required.'};
  }

  const satPackages = (metadata?.packages ?? []).filter(
    (pkg: {name?: string; version?: string}) =>
      pkg.name === 'junobuild-satellite' && satisfies(pkg.version ?? '0.0.0', requiredSatVersion)
  );

  if (satPackages.length === 0) {
    return {error: 'No junobuild-satellite package found in the dependency tree.'};
  }

  // If the developer has multiple crates within the workspace depending on different versions of the junobuild-satellite library.
  // This is unusual, as the convention is to have one Satellite per project.
  // For now, we throw an error and ask the developer to reach out.
  if (satPackages.length > 1) {
    return {
      error:
        'Multiple junobuild-satellite crates found in the dependency tree. This is not supported at the moment. Please reach out.'
    };
  }

  const [satPackage] = satPackages;

  const satelliteVersion: string | null | undefined = satPackage.metadata?.juno?.satellite?.version;

  if (isNullish(satelliteVersion) || isEmptyString(satelliteVersion)) {
    const normalizeVersion = (version: string): string =>
      version
        .trim()
        .replace(/^[=^~><]+/, '') // Remove leading =, ^, ~, >, <, >=, <=
        .replace(/\s+/, ''); // In case there's a trailing space

    // juno.package.json (used for the WASM custom public section) was introduced after Satellite v0.0.22.
    // If the Satellite version is newer, the absence of this metadata is unexpected and we throw an error.
    if (compare(normalizeVersion(requiredSatVersion), '0.0.22') > 0) {
      return {
        error:
          'The metadata required to specify the Satellite version is missing. This is unexpected.'
      };
    }

    // For backward compatibility with older versions, we fall back to the legacy ic-wasm approach,
    // appending build=extended to the custom section.
    return {build: 'legacy'};
  }

  return {build: 'modern', version, satelliteVersion};
};

const icWasm = async ({buildType}: {buildType: BuildType}) => {
  await mkdir(DEPLOY_LOCAL_REPLICA_PATH, {recursive: true});

  // Remove unused functions and debug info.
  await spawn({
    command: 'ic-wasm',
    args: [
      join(CARGO_RELEASE_DIR, 'satellite.wasm'),
      '-o',
      SATELLITE_OUTPUT,
      'shrink',
      '--keep-name-section'
    ]
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
      'public',
      '--keep-name-section'
    ]
  });

  // @deprecated
  const appendJunoBuild = async () => {
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
        'public',
        '--keep-name-section'
      ]
    });
  };

  const appendJunoPackage = async () => {
    await spawn({
      command: 'ic-wasm',
      args: [
        SATELLITE_OUTPUT,
        '-o',
        SATELLITE_OUTPUT,
        'metadata',
        'juno:package',
        '-f',
        JUNO_PACKAGE_JSON_PATH,
        '-v',
        'public',
        '--keep-name-section'
      ]
    });
  };

  const appendMetadata = buildType.build === 'legacy' ? appendJunoBuild : appendJunoPackage;
  await appendMetadata();

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
      'public',
      '--keep-name-section'
    ]
  });
};

const successMsg = async (spinner: Ora) => {
  const gzipOutput = `${SATELLITE_OUTPUT}.gz`;
  const {size} = await lstat(gzipOutput);

  spinner.succeed(
    `Build complete at ${formatTime()}\n→ Output file: ${yellow(
      relative(process.cwd(), gzipOutput)
    )} (${formatBytes(size)})`
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
