import {notEmptyString} from '@dfinity/utils';
import {isEmptyString} from '@dfinity/utils/dist/types/utils/nullish.utils';
import {buildEsm, execute} from '@junobuild/cli-tools';
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

  await copyMetadata();

  await buildWithEsbuild(params);
};

const buildWithEsbuild = async ({lang, path}: BuildArgsTsJs) => {
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

  const [key, {bytes}] = entry[0];

  console.log(`${green('✔')} Build complete at ${formatTime()} (esbuild ${version})`);
  console.log(`→ ${yellow(key)} (${formatBytes(bytes)})`);
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

const copyMetadata = async (): Promise<void> => {
  if (!existsSync(PACKAGE_JSON_PATH)) {
    // No package.json therefore no metadata to pass to the build in the container.
    return;
  }

  try {
    const {juno, version} = await readPackageJson();

    if (isEmptyString(juno?.functions?.version) && isEmptyString(version)) {
      // No version detected therefore no metadata to the build in the container.
      return;
    }

    const functionsVersion = juno?.functions?.version;

    const packageJson = {
      ...(notEmptyString(version) && {version}),
      ...(notEmptyString(functionsVersion) && {juno})
    };

    await writeFile(PACKAGE_JSON_SPUTNIK_PATH, JSON.stringify(packageJson, null, 2), 'utf-8');
  } catch (_err: unknown) {
    // We want to continue the build process even if copying package.json fails,
    // since it's only used to set the extended custom version.
    console.log('⚠️ Could not copy package.json for the build.');
  }
};
