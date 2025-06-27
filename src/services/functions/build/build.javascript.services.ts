import {notEmptyString} from '@dfinity/utils';
import {buildEsm, execute, formatBytes} from '@junobuild/cli-tools';
import type {Metafile} from 'esbuild';
import {green, magenta, red, yellow} from 'kleur';
import {join} from 'node:path';
import {
  DEPLOY_SPUTNIK_PATH,
  DEVELOPER_PROJECT_SATELLITE_PATH,
  INDEX_MJS,
  INDEX_TS
} from '../../../constants/dev.constants';
import type {BuildArgs, BuildLang, BuildMetadata} from '../../../types/build';
import {formatTime} from '../../../utils/format.utils';
import {detectPackageManager} from '../../../utils/pm.utils';
import {confirmAndExit} from '../../../utils/prompt.utils';
import {readEmulatorConfigAndCreateDeployTargetDir} from '../../emulator.services';
import {prepareJavaScriptBuildMetadata} from './build.metadata.services';

export const buildTypeScript = async ({
  paths,
  exitOnError
}: Pick<BuildArgs, 'paths' | 'exitOnError'> = {}) => {
  await build({lang: 'ts', paths, exitOnError});
};

export const buildJavaScript = async ({
  paths,
  exitOnError
}: Pick<BuildArgs, 'paths' | 'exitOnError'> = {}) => {
  await build({lang: 'mjs', paths, exitOnError});
};

type BuildArgsTsJs = {lang: Omit<BuildLang, 'rs'>} & Pick<BuildArgs, 'paths' | 'exitOnError'>;

const build = async ({exitOnError, ...params}: BuildArgsTsJs) => {
  await installEsbuild();

  await readEmulatorConfigAndCreateDeployTargetDir();

  try {
    const metadata = await prepareJavaScriptBuildMetadata();

    const buildResult = await buildWithEsbuild({params, metadata});

    printResults({metadata, buildResult});
  } catch (_error: unknown) {
    if (exitOnError !== false) {
      process.exit(1);
    }
  }
};

interface BuildResult {
  version: string;
  output: [string, Metafile['outputs'][0]];
}

const buildWithEsbuild = async ({
  params: {lang, paths},
  metadata
}: {
  params: Omit<BuildArgsTsJs, 'exitOnError'>;
  metadata: BuildMetadata;
}): Promise<BuildResult> => {
  const infile =
    paths?.source ?? join(DEVELOPER_PROJECT_SATELLITE_PATH, lang === 'mjs' ? INDEX_MJS : INDEX_TS);

  // We pass the package information as metadata so the Docker container can read it and embed it into the `juno:package` custom section of the WASM’s public metadata.
  const banner = {
    js: `// @juno:package ${JSON.stringify(metadata)};`
  };

  const {metafile, errors, warnings, version} = await buildEsm({
    infile,
    outfile: DEPLOY_SPUTNIK_PATH,
    banner
  });

  for (const {text} of warnings) {
    console.log(`${yellow('[Warn]')} ${text}`);
  }

  for (const {text} of errors) {
    console.log(`${red('[Error]')} ${text}`);
  }

  if (errors.length > 0) {
    throw new Error();
  }

  const entry = Object.entries(metafile.outputs);

  if (entry.length === 0) {
    console.log(red('Unexpected: No metafile resulting from the build was found.'));
    throw new Error();
  }

  return {
    output: entry[0],
    version
  };
};

const installEsbuild = async () => {
  const esbuildInstalled = await hasEsbuild();

  if (esbuildInstalled) {
    return;
  }

  await confirmAndExit(
    `${magenta('esbuild')} is required to build the serverless functions. Install it now?`
  );

  const pm = detectPackageManager();

  await execute({
    command: pm ?? 'npm',
    args: [pm === 'npm' ? 'i' : 'add', 'esbuild', '-D']
  });
};

const hasEsbuild = async (): Promise<boolean> => {
  try {
    await import('esbuild');
    return true;
  } catch (_err: unknown) {
    return false;
  }
};

const printResults = ({
  metadata,
  buildResult
}: {
  metadata: BuildMetadata;
  buildResult: BuildResult;
}) => {
  const {output, version: esbuildVersion} = buildResult;
  const [key, {bytes}] = output;

  // The version defined by the developer for their serverless functions - not the version of the Satellite provided by Juno.
  const extendedVersion = metadata?.juno?.functions?.version ?? metadata?.version;
  const version = notEmptyString(extendedVersion) ? `version ${extendedVersion}, ` : ' ';

  console.log(
    `${green('✔')} Build complete at ${formatTime()} (${version}esbuild ${esbuildVersion})`
  );
  console.log(`→ ${yellow(key)} (${formatBytes(bytes)})`);
};
