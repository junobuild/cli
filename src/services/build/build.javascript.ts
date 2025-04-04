import {isEmptyString, isNullish, notEmptyString} from '@dfinity/utils';
import {buildEsm, execute} from '@junobuild/cli-tools';
import type {Metafile} from 'esbuild';
import {green, magenta, red, yellow} from 'kleur';
import {existsSync} from 'node:fs';
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {
  DEPLOY_LOCAL_REPLICA_PATH,
  DEPLOY_SPUTNIK_PATH,
  DEVELOPER_PROJECT_SATELLITE_PATH,
  INDEX_MJS,
  INDEX_TS,
  PACKAGE_JSON_PATH,
  PACKAGE_JSON_SPUTNIK_PATH
} from '../../constants/dev.constants';
import type {BuildArgs, BuildLang} from '../../types/build';
import type {PackageJson} from '../../types/pkg';
import {formatBytes, formatTime} from '../../utils/format.utils';
import {readPackageJson} from '../../utils/pkg.utils';
import {detectPackageManager} from '../../utils/pm.utils';
import {confirmAndExit} from '../../utils/prompt.utils';

export const buildTypeScript = async ({path}: Pick<BuildArgs, 'path'> = {}) => {
  await build({lang: 'ts', path});
};

export const buildJavaScript = async ({path}: Pick<BuildArgs, 'path'> = {}) => {
  await build({lang: 'mjs', path});
};

type BuildArgsTsJs = {lang: Omit<BuildLang, 'rs'>} & Pick<BuildArgs, 'path'>;

const build = async (params: BuildArgsTsJs) => {
  await installEsbuild();

  await createTargetDir();

  const metadata = await prepareMetadata();

  await copyMetadata(metadata);

  const buildResult = await buildWithEsbuild(params);

  printResults({metadata, buildResult});
};

interface BuildResult {
  version: string;
  output: [string, Metafile['outputs'][0]];
}

const buildWithEsbuild = async ({lang, path}: BuildArgsTsJs): Promise<BuildResult> => {
  const infile =
    path ?? join(DEVELOPER_PROJECT_SATELLITE_PATH, lang === 'mjs' ? INDEX_MJS : INDEX_TS);

  const {metafile, errors, warnings, version} = await buildEsm({
    infile,
    outfile: DEPLOY_SPUTNIK_PATH
  });

  for (const {text} of warnings) {
    console.log(`${yellow('[Warn]')} ${text}`);
  }

  for (const {text} of errors) {
    console.log(`${red('[Error]')} ${text}`);
  }

  if (errors.length > 0) {
    process.exit(1);
  }

  const entry = Object.entries(metafile.outputs);

  if (entry.length === 0) {
    console.log(red('Unexpected: No metafile resulting from the build was found.'));
    process.exit(1);
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
    const {juno, version} = await readPackageJson();

    if (isEmptyString(juno?.functions?.version) && isEmptyString(version)) {
      // No version detected therefore no metadata to the build in the container.
      return undefined;
    }

    const functionsVersion = juno?.functions?.version;

    return {
      ...(notEmptyString(version) && {version}),
      ...(notEmptyString(functionsVersion) && {juno})
    };
  } catch (_err: unknown) {
    // We want to continue the build process even if copying package.json fails,
    // since it's only used to set the extended custom version.
    console.log('⚠️ Could not read build metadata from package.json.');
    return undefined;
  }
};

const copyMetadata = async (metadata: BuildMetadata): Promise<void> => {
  if (isNullish(metadata)) {
    // No metadata to pass to the build in the container.
    return;
  }

  try {
    await writeFile(PACKAGE_JSON_SPUTNIK_PATH, JSON.stringify(metadata, null, 2), 'utf-8');
  } catch (_err: unknown) {
    // We want to continue the build process even if copying package.json fails,
    // since it's only used to set the extended custom version.
    console.log('⚠️ Could not copy package.json for the build.');
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
