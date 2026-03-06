import {notEmptyString} from '@dfinity/utils';
import {formatBytes, generateFunctions, type GenerateResultData} from '@junobuild/cli-tools';
import {green, red, yellow} from 'kleur';
import {join} from 'node:path';
import {
  DEPLOY_SPUTNIK_FUNCTIONS_PATH,
  DEPLOY_SPUTNIK_SCRIPT_PATH,
  DEVELOPER_PROJECT_SATELLITE_PATH,
  INDEX_MJS,
  INDEX_TS
} from '../../../constants/dev.constants';
import type {BuildArgs, BuildLang, BuildMetadata} from '../../../types/build';
import {installEsbuild} from '../../../utils/esbuild.utils';
import {formatTime} from '../../../utils/format.utils';
import {readEmulatorConfigAndCreateDeployTargetDir} from '../../emulator/_fs.services';
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

    const buildResult = await generate({params, metadata});

    printResults({metadata, buildResult});
  } catch (_error: unknown) {
    if (exitOnError !== false) {
      process.exit(1);
    }
  }
};


const generate = async ({
  params: {lang, paths},
  metadata
}: {
  params: Omit<BuildArgsTsJs, 'exitOnError'>;
  metadata: BuildMetadata;
}): Promise<GenerateResultData> => {
  const infile =
    paths?.source ?? join(DEVELOPER_PROJECT_SATELLITE_PATH, lang === 'mjs' ? INDEX_MJS : INDEX_TS);

  // We pass the package information as metadata so the Docker container can read it and embed it into the `juno:package` custom section of the WASM’s public metadata.
  const banner = {
    js: `// @juno:package ${JSON.stringify(metadata)};`
  };

  const result = await generateFunctions({
    infile,
    banner,
    outfileJs: DEPLOY_SPUTNIK_SCRIPT_PATH,
    outfileRs: DEPLOY_SPUTNIK_FUNCTIONS_PATH
  });

  if (result.status === 'success') {
    return result.result;
  }

  const {warnings, errors} = result;

  for (const text of warnings ?? []) {
    console.log(`${yellow('[Warn]')} ${text}`);
  }

  for (const text of errors) {
    console.log(`${red('[Error]')} ${text}`);
  }

  throw new Error();
};

const printResults = ({
  metadata,
  buildResult
}: {
  metadata: BuildMetadata;
  buildResult: GenerateResultData;
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
