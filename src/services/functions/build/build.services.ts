import {debounce, nonNullish} from '@dfinity/utils';
import chokidar from 'chokidar';
import {red} from 'kleur';
import {existsSync} from 'node:fs';
import {basename, dirname, extname} from 'node:path';
import {
  DEVELOPER_PROJECT_SATELLITE_CARGO_TOML,
  DEVELOPER_PROJECT_SATELLITE_INDEX_MJS,
  DEVELOPER_PROJECT_SATELLITE_INDEX_TS,
  DEVELOPER_PROJECT_SATELLITE_PATH,
  SPUTNIK_CARGO_TOML
} from '../../../constants/dev.constants';
import {ENV} from '../../../env';
import {SMALL_TITLE} from '../../../help/help';
import {type BuildArgs} from '../../../types/build';
import {buildArgs} from '../../../utils/build.utils';
import {buildJavaScript, buildTypeScript} from './build.javascript.services';
import {buildRust} from './build.rust.services';
import {dispatchEmulatorUpgrade} from '../../emulator/dispatch.services';

export const build = async (args?: string[]) => {
  const {watch, ...params} = buildArgs(args);

  if (nonNullish(watch) && watch !== false) {
    watchBuild({watch, ...params});
    return;
  }

  await executeBuildAndUpgrade(params);
};

const executeBuildAndUpgrade = async (params: Omit<BuildArgs, 'watch'>) => {
  const {result} = await executeBuild(params);

  if (result !== 'success') {
    return;
  }

  await dispatchEmulatorUpgrade();
};

const executeBuild = async ({
  lang,
  paths,
  exitOnError
}: Omit<BuildArgs, 'watch'>): Promise<{result: 'success' | 'error' | 'unknown'}> => {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (lang) {
    case 'rs':
      return await buildRust({paths});
    case 'ts':
      return await executeSputnikBuild({paths, exitOnError, buildFn: buildTypeScript});
    case 'mjs':
      return await executeSputnikBuild({paths, exitOnError, buildFn: buildJavaScript});
  }

  const isPathToml =
    nonNullish(paths?.cargo) &&
    basename(paths.cargo) === basename(DEVELOPER_PROJECT_SATELLITE_CARGO_TOML);

  if (isPathToml) {
    return await buildRust({paths});
  }

  const isPathTypeScript =
    nonNullish(paths?.source) &&
    extname(paths.source) === extname(DEVELOPER_PROJECT_SATELLITE_INDEX_TS);

  if (isPathTypeScript) {
    return await executeSputnikBuild({paths, exitOnError, buildFn: buildTypeScript});
  }

  const isPathJavaScript =
    nonNullish(paths?.source) &&
    extname(paths.source) === extname(DEVELOPER_PROJECT_SATELLITE_INDEX_MJS);

  if (isPathJavaScript) {
    return await executeSputnikBuild({paths, exitOnError, buildFn: buildJavaScript});
  }

  if (existsSync(DEVELOPER_PROJECT_SATELLITE_CARGO_TOML)) {
    return await buildRust();
  }

  if (existsSync(DEVELOPER_PROJECT_SATELLITE_INDEX_TS)) {
    return await executeSputnikBuild({
      paths: {
        ...paths,
        source: DEVELOPER_PROJECT_SATELLITE_INDEX_TS
      },
      exitOnError,
      buildFn: buildTypeScript
    });
  }

  if (existsSync(DEVELOPER_PROJECT_SATELLITE_INDEX_MJS)) {
    return await executeSputnikBuild({
      paths: {
        ...paths,
        source: DEVELOPER_PROJECT_SATELLITE_INDEX_MJS
      },
      exitOnError,
      buildFn: buildJavaScript
    });
  }

  console.log(
    red(
      'No source found for Satellite serverless functions. Expected a Rust, TypeScript, or JavaScript project.'
    )
  );

  return {result: 'unknown'};
};

const executeSputnikBuild = async ({
  paths,
  exitOnError,
  buildFn
}: Omit<BuildArgs, 'watch'> & {
  buildFn: (
    args: Pick<BuildArgs, 'paths' | 'exitOnError'>
  ) => Promise<{result: 'success' | 'error'}>;
}): Promise<{result: 'success' | 'error'}> => {
  const {result: resultBuild} = await buildFn({paths, exitOnError});

  if (resultBuild === 'error') {
    return {result: 'error'};
  }

  const withToolchain = nonNullish(paths?.cargo) || ENV.ci;

  if (withToolchain) {
    const rustPaths = {
      ...paths,
      cargo: paths?.cargo ?? SPUTNIK_CARGO_TOML
    };

    return await buildRust({paths: rustPaths, target: 'wasm32-wasip1'});
  }

  return {result: 'success'};
};

export const watchBuild = ({watch, paths, ...params}: BuildArgs) => {
  const doBuild = async () => {
    console.log(`\n⏱ Rebuilding serverless functions...`);
    await executeBuildAndUpgrade({paths, exitOnError: false, ...params});
  };

  const DEFAULT_TIMEOUT = 10_000;
  const timeout =
    nonNullish(watch) && typeof watch === 'string' ? parseInt(watch) : DEFAULT_TIMEOUT;

  const debounceBuild = debounce(doBuild, !isNaN(timeout) ? timeout : DEFAULT_TIMEOUT);

  const watchOnEvent = () => {
    debounceBuild();
  };

  const watchPath = nonNullish(paths?.source)
    ? dirname(paths.source)
    : nonNullish(paths?.cargo)
      ? dirname(paths.cargo)
      : DEVELOPER_PROJECT_SATELLITE_PATH;

  console.log(SMALL_TITLE);
  console.log('👀 Watching for file changes');

  chokidar
    .watch(watchPath, {
      ignoreInitial: true,
      awaitWriteFinish: true
    })
    .on('add', watchOnEvent)
    .on('change', watchOnEvent)
    .on('error', (err) => {
      console.log(red('️‼️  Unexpected error while live reloading:'), err);
    });
};
