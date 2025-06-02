import {isEmptyString, notEmptyString} from '@dfinity/utils';
import {buildEsm, execute, type PackageJson} from '@junobuild/cli-tools';
import type {Metafile} from 'esbuild';
import {green, magenta, red, yellow} from 'kleur';
import {existsSync} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {
  DEPLOY_LOCAL_REPLICA_PATH,
  DEPLOY_SPUTNIK_PATH,
  DEVELOPER_PROJECT_SATELLITE_PATH,
  INDEX_MJS,
  INDEX_TS,
  PACKAGE_JSON_PATH
} from '../../../constants/dev.constants';
import type {BuildArgs, BuildLang} from '../../../types/build';
import {formatBytes, formatTime} from '../../../utils/format.utils';
import {readPackageJson} from '../../../utils/pkg.utils';
import {detectPackageManager} from '../../../utils/pm.utils';
import {confirmAndExit} from '../../../utils/prompt.utils';

export const buildTypeScript = async ({
  path,
  exitOnError
}: Pick<BuildArgs, 'path' | 'exitOnError'> = {}) => {
  await build({lang: 'ts', path, exitOnError});
};

export const buildJavaScript = async ({
  path,
  exitOnError
}: Pick<BuildArgs, 'path' | 'exitOnError'> = {}) => {
  await build({lang: 'mjs', path, exitOnError});
};

type BuildArgsTsJs = {lang: Omit<BuildLang, 'rs'>} & Pick<BuildArgs, 'path' | 'exitOnError'>;

const build = async ({exitOnError, ...params}: BuildArgsTsJs) => {
  await installEsbuild();

  await createTargetDir();

  try {
    const metadata = await prepareMetadata();

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
  params: {lang, path},
  metadata
}: {
  params: Omit<BuildArgsTsJs, 'exitOnError'>;
  metadata: BuildMetadata;
}): Promise<BuildResult> => {
  const infile =
    path ?? join(DEVELOPER_PROJECT_SATELLITE_PATH, lang === 'mjs' ? INDEX_MJS : INDEX_TS);

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

const createTargetDir = async () => {
  // Create output target/deploy if it does not yet exist.
  await mkdir(DEPLOY_LOCAL_REPLICA_PATH, {recursive: true});
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

type BuildMetadata = Omit<PackageJson, 'dependencies'> | undefined;

const prepareMetadata = async (): Promise<BuildMetadata> => {
  if (!existsSync(PACKAGE_JSON_PATH)) {
    // No package.json therefore no metadata to pass to the build in the container.
    return undefined;
  }

  try {
    const {juno, version, name} = await readPackageJson();

    if (isEmptyString(juno?.functions?.version) && isEmptyString(version)) {
      // No version detected therefore no metadata to the build in the container.
      return undefined;
    }

    const functionsVersion = juno?.functions?.version;

    return {
      ...(notEmptyString(name) && {name}),
      ...(notEmptyString(version) && {version}),
      ...(notEmptyString(functionsVersion) && {juno})
    };
  } catch (err: unknown) {
    console.log(red('⚠️ Could not read build metadata from package.json.'));
    throw err;
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
