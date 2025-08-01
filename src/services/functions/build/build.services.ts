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
import {dispatchEmulatorTouchSputnik} from '../../emulator/emulator.touch.services';
import {buildJavaScript, buildTypeScript} from './build.javascript.services';
import {buildRust} from './build.rust.services';

export const build = async (args?: string[]) => {
  const {watch, ...params} = buildArgs(args);

  if (nonNullish(watch) && watch !== false) {
    watchBuild({watch, ...params});
    return;
  }

  await executeBuild(params);
};

const executeBuild = async ({lang, paths, exitOnError}: Omit<BuildArgs, 'watch'>) => {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (lang) {
    case 'rs':
      await buildRust({paths});
      return;
    case 'ts':
      await executeSputnikBuild({paths, exitOnError, buildFn: buildTypeScript});
      return;
    case 'mjs':
      await executeSputnikBuild({paths, exitOnError, buildFn: buildJavaScript});
      return;
  }

  const isPathToml =
    nonNullish(paths?.cargo) &&
    basename(paths.cargo) === basename(DEVELOPER_PROJECT_SATELLITE_CARGO_TOML);

  if (isPathToml) {
    await buildRust({paths});
    return;
  }

  const isPathTypeScript =
    nonNullish(paths?.source) &&
    extname(paths.source) === extname(DEVELOPER_PROJECT_SATELLITE_INDEX_TS);

  if (isPathTypeScript) {
    await executeSputnikBuild({paths, exitOnError, buildFn: buildTypeScript});
    return;
  }

  const isPathJavaScript =
    nonNullish(paths?.source) &&
    extname(paths.source) === extname(DEVELOPER_PROJECT_SATELLITE_INDEX_MJS);

  if (isPathJavaScript) {
    await executeSputnikBuild({paths, exitOnError, buildFn: buildJavaScript});
    return;
  }

  if (existsSync(DEVELOPER_PROJECT_SATELLITE_CARGO_TOML)) {
    await buildRust();
    return;
  }

  if (existsSync(DEVELOPER_PROJECT_SATELLITE_INDEX_TS)) {
    await executeSputnikBuild({
      paths: {
        ...paths,
        source: DEVELOPER_PROJECT_SATELLITE_INDEX_TS
      },
      exitOnError,
      buildFn: buildTypeScript
    });
    return;
  }

  if (existsSync(DEVELOPER_PROJECT_SATELLITE_INDEX_MJS)) {
    await executeSputnikBuild({
      paths: {
        ...paths,
        source: DEVELOPER_PROJECT_SATELLITE_INDEX_MJS
      },
      exitOnError,
      buildFn: buildJavaScript
    });
    return;
  }

  console.log(
    red(
      'No source found for Satellite serverless functions. Expected a Rust, TypeScript, or JavaScript project.'
    )
  );
};

const executeSputnikBuild = async ({
  paths,
  exitOnError,
  buildFn
}: Omit<BuildArgs, 'watch'> & {
  buildFn: (args: Pick<BuildArgs, 'paths' | 'exitOnError'>) => Promise<void>;
}) => {
  await buildFn({paths, exitOnError});

  const withToolchain = nonNullish(paths?.cargo) || ENV.ci;

  if (!withToolchain) {
    await dispatchEmulatorTouchSputnik();
    return;
  }

  const rustPaths = {
    ...paths,
    cargo: paths?.cargo ?? SPUTNIK_CARGO_TOML
  };

  await buildRust({paths: rustPaths, target: 'wasm32-wasip1'});
};

export const watchBuild = ({watch, paths, ...params}: BuildArgs) => {
  const doBuild = async () => {
    console.log(`\n⏱ Rebuilding serverless functions...`);
    await executeBuild({paths, exitOnError: false, ...params});
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
