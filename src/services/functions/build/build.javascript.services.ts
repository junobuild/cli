import {isNullish, nonNullish, notEmptyString} from '@dfinity/utils';
import {
  buildAndGenerateFunctions,
  formatBytes,
  type GenerateResultData
} from '@junobuild/cli-tools';
import {green, red, yellow} from 'kleur';
import {join} from 'node:path';
import ora from 'ora';
import {
  DEPLOY_SPUTNIK_FUNCTIONS_PATH,
  DEPLOY_SPUTNIK_SCRIPT_PATH,
  DEVELOPER_PROJECT_SATELLITE_PATH,
  INDEX_MJS,
  INDEX_TS
} from '../../../constants/dev.constants';
import type {BuildArgs, BuildLang, BuildMetadata} from '../../../types/build';
import {checkIcpBindgen} from '../../../utils/build.bindgen.utils';
import {installEsbuild} from '../../../utils/esbuild.utils';
import {formatTime} from '../../../utils/format.utils';
import {readEmulatorConfigAndCreateDeployTargetDir} from '../../emulator/_fs.services';
import {generateSchemaApi} from './build.api.services';
import {generateJsTsDid} from './build.did.services';
import {generateIdl} from './build.idl.services';
import {prepareJavaScriptBuildMetadata} from './build.metadata.services';

export const buildTypeScript = async ({
  paths,
  exitOnError
}: Pick<BuildArgs, 'paths' | 'exitOnError'> = {}) => {
  await generateAndBuild({lang: 'ts', paths, exitOnError});
};

export const buildJavaScript = async ({
  paths,
  exitOnError
}: Pick<BuildArgs, 'paths' | 'exitOnError'> = {}) => {
  await generateAndBuild({lang: 'mjs', paths, exitOnError});
};

type BuildArgsTsJs = {lang: Omit<BuildLang, 'rs'>} & Pick<BuildArgs, 'paths' | 'exitOnError'>;

const generateAndBuild = async ({lang, ...rest}: BuildArgsTsJs) => {
  const result = await build({lang, ...rest});

  if (result.status === 'error') {
    return;
  }

  const {result: generatedData} = result;

  const spinner = ora('Generating API...').start();

  try {
    await generateJsTsDid({generatedData});

    await generateIdl();
    await generateSchemaApi({generatedData, lang});

    if (isNullish(generatedData.generate)) {
      spinner.stop();
      return;
    }

    spinner.succeed('API generated');
  } catch {
    spinner.fail('Error generating API');
  }
};

const build = async ({
  exitOnError,
  ...params
}: BuildArgsTsJs): Promise<{status: 'success'; result: GenerateResultData} | {status: 'error'}> => {
  await installEsbuild();

  const {valid: validBindgen} = await checkIcpBindgen();

  if (!validBindgen) {
    return {status: 'error'};
  }

  await readEmulatorConfigAndCreateDeployTargetDir();

  try {
    const metadata = await prepareJavaScriptBuildMetadata();

    const buildResult = await generate({params, metadata});

    printResults({metadata, generateResult: buildResult});

    return {status: 'success', result: buildResult};
  } catch (_error: unknown) {
    if (exitOnError !== false) {
      process.exit(1);
    }

    return {status: 'error'};
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

  const result = await buildAndGenerateFunctions({
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
  generateResult: {generate, build}
}: {
  metadata: BuildMetadata;
  generateResult: GenerateResultData;
}) => {
  const {output, version: esbuildVersion, outputPath} = build;
  const [_key, {bytes}] = output;

  // The version defined by the developer for their serverless functions - not the version of the Satellite provided by Juno.
  const extendedVersion = metadata?.juno?.functions?.version ?? metadata?.version;
  const version = notEmptyString(extendedVersion) ? `version ${extendedVersion}, ` : ' ';

  console.log(
    `${green('✔')} Build complete at ${formatTime()} (${version}esbuild ${esbuildVersion})`
  );

  console.log(`→ ${yellow(outputPath)} (${formatBytes(bytes)})`);

  if (nonNullish(generate)) {
    const {queries, updates, outputPath} = generate;

    console.log(
      `${green('⬡')} ${queries.length} queries and ${updates.length} updates generated to ${yellow(outputPath)}`
    );
  }
};
