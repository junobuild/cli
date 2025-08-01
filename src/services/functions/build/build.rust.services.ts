import {isEmptyString, isNullish, nonNullish} from '@dfinity/utils';
import {execute, formatBytes, gzipFile, spawn} from '@junobuild/cli-tools';
import {generateApi} from '@junobuild/did-tools';
import {red, yellow} from 'kleur';
import {existsSync} from 'node:fs';
import {copyFile, lstat, mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import {join, relative} from 'node:path';
import ora, {type Ora} from 'ora';
import {compare, minVersion, satisfies} from 'semver';
import {detectJunoDevConfigType} from '../../../configs/juno.dev.config';
import {
  DEPLOY_SPUTNIK_PATH,
  DEVELOPER_PROJECT_SATELLITE_DECLARATIONS_PATH,
  DEVELOPER_PROJECT_SATELLITE_PATH,
  JUNO_PACKAGE_JSON_PATH,
  SATELLITE_OUTPUT,
  SATELLITE_PROJECT_NAME,
  SPUTNIK_PROJECT_NAME,
  TARGET_PATH
} from '../../../constants/dev.constants';
import type {BuildArgs, BuildType} from '../../../types/build';
import {
  checkCandidExtractor,
  checkIcWasm,
  checkJunoDidc,
  checkWasi2ic
} from '../../../utils/build.rust.utils';
import {readSatelliteDid} from '../../../utils/did.utils';
import {checkRustVersion} from '../../../utils/env.utils';
import {formatTime} from '../../../utils/format.utils';
import {readPackageJson} from '../../../utils/pkg.utils';
import {readEmulatorConfigAndCreateDeployTargetDir} from '../../emulator/emulator.fs.services';
import {prepareJunoPkgForSatellite, prepareJunoPkgForSputnik} from './build.metadata.services';
import {dispatchEmulatorTouchSatellite} from './touch.services';

export const buildRust = async ({
  paths,
  target
}: Pick<BuildArgs, 'paths'> & {target?: 'wasm32-unknown-unknown' | 'wasm32-wasip1'} = {}) => {
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

  const {valid: validWasi2ic} = target === 'wasm32-wasip1' ? await checkWasi2ic() : {valid: true};

  if (!validWasi2ic) {
    return;
  }

  const defaultProjectArgs = ['-p', SATELLITE_PROJECT_NAME];

  const cargoTarget = target ?? 'wasm32-unknown-unknown';
  const cargoReleaseDir = join(process.cwd(), 'target');
  const cargoOutputWasm = join(cargoReleaseDir, cargoTarget, 'release', 'satellite.wasm');

  const args = [
    'build',
    '--target',
    cargoTarget,
    ...(nonNullish(paths?.cargo) ? ['--manifest-path', paths.cargo] : defaultProjectArgs),
    '--release',
    ...(existsSync('Cargo.lock') ? ['--locked'] : []),
    '--target-dir',
    cargoReleaseDir
  ];

  const env = {
    ...process.env,
    RUSTFLAGS: '--cfg getrandom_backend="custom"',
    ...(target === 'wasm32-wasip1' && {DEV_SCRIPT_PATH: DEPLOY_SPUTNIK_PATH})
  };

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
    const buildType = await extractBuildType({paths});

    if ('error' in buildType) {
      console.log(red(buildType.error));
      return;
    }

    switch (target) {
      case 'wasm32-wasip1': {
        spinner.text = 'Converting WASI to IC...';

        // The output of the Sputnik build is sputnik.wasm but, the developer and tools is expecting using satellite.wasm
        await copyFile(
          join(cargoReleaseDir, 'wasm32-wasip1', 'release', `${SPUTNIK_PROJECT_NAME}.wasm`),
          cargoOutputWasm
        );

        await wasi2ic({cargoOutputWasm});

        const result = await prepareJunoPkgForSputnik({buildType});

        if ('error' in result) {
          console.log(red(result.error));
          return {result: 'error'};
        }

        break;
      }
      default: {
        await prepareJunoPkgForSatellite({buildType});
      }
    }

    spinner.text = 'Generating DID...';

    await did({cargoOutputWasm});

    if (target !== 'wasm32-wasip1') {
      // TODO: support binding files for serverless functions in JS/TS
      await didc();
      await api();
    }

    spinner.text = 'Binding metadata...';

    await icWasm({buildType, cargoOutputWasm});

    spinner.text = 'Compressing...';

    // We use a temporary file otherwise the automatic deployment in Docker may start with a file that is not yet fully gzipped
    await gzipFile({source: SATELLITE_OUTPUT, destination: `${SATELLITE_OUTPUT}.tmp.gz`});

    await rename(`${SATELLITE_OUTPUT}.tmp.gz`, `${SATELLITE_OUTPUT}.gz`);

    await successMsg(spinner);
  } finally {
    spinner.stop();
  }

  await dispatchEmulatorTouchSatellite();
};

const SATELLITE_DID_FILE = join(DEVELOPER_PROJECT_SATELLITE_PATH, 'satellite.did');
const EXTENSION_DID_FILE_NAME = 'satellite_extension.did';
const SATELLITE_CUSTOM_DID_FILE = join(DEVELOPER_PROJECT_SATELLITE_PATH, EXTENSION_DID_FILE_NAME);

const AUTO_GENERATED = `// This file was automatically generated by the Juno CLI.
// Any modifications may be overwritten.`;

const did = async ({cargoOutputWasm}: {cargoOutputWasm: string}) => {
  let candid = '';
  await spawn({
    command: 'candid-extractor',
    args: [cargoOutputWasm],
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

const extractBuildType = async ({paths}: Pick<BuildArgs, 'paths'> = {}): Promise<
  BuildType | {error: string}
> => {
  await mkdir(TARGET_PATH, {recursive: true});

  const manifestArgs = nonNullish(paths?.cargo) ? ['--manifest-path', paths.cargo] : [];

  let output = '';
  await spawn({
    command: 'cargo',
    args: ['metadata', '--format-version', '1', ...manifestArgs],
    stdout: (o) => (output += o),
    silentErrors: true
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
    const minSatVersion = minVersion(requiredSatVersion);

    // juno.package.json (used for the WASM custom public section) was introduced after Satellite v0.0.22.
    // If the Satellite version is newer, the absence of this metadata is unexpected and we throw an error.
    if (isNullish(minSatVersion) || compare(minSatVersion.version, '0.0.22') > 0) {
      return {
        error:
          'The metadata required to specify the Satellite version is missing. This is unexpected.'
      };
    }

    // For backward compatibility with older versions, we fall back to the legacy ic-wasm approach,
    // appending build=extended to the custom section.
    return {build: 'legacy'};
  }

  const sputnikPkg = (metadata?.packages ?? []).find((pkg) => pkg?.name === SPUTNIK_PROJECT_NAME);

  return {
    build: 'modern',
    version,
    satelliteVersion,
    ...(nonNullish(sputnikPkg) && {sputnikVersion: sputnikPkg.version})
  };
};

const icWasm = async ({
  buildType,
  cargoOutputWasm
}: {
  buildType: BuildType;
  cargoOutputWasm: string;
}) => {
  await readEmulatorConfigAndCreateDeployTargetDir();

  // Remove unused functions and debug info.
  await spawn({
    command: 'ic-wasm',
    args: [cargoOutputWasm, '-o', SATELLITE_OUTPUT, 'shrink', '--keep-name-section']
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

const wasi2ic = async ({cargoOutputWasm}: {cargoOutputWasm: string}) => {
  await execute({
    command: 'wasi2ic',
    args: [cargoOutputWasm, cargoOutputWasm, '--quiet']
  });
};
