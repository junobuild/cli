import {debounce, nonNullish} from '@dfinity/utils';
import {hasArgs, nextArg} from '@junobuild/cli-tools';
import chokidar from 'chokidar';
import {red} from 'kleur';
import {existsSync} from 'node:fs';
import {basename, dirname, extname} from 'node:path';
import {
  DEVELOPER_PROJECT_SATELLITE_CARGO_TOML,
  DEVELOPER_PROJECT_SATELLITE_INDEX_MJS,
  DEVELOPER_PROJECT_SATELLITE_INDEX_TS,
  DEVELOPER_PROJECT_SATELLITE_PATH
} from '../../constants/dev.constants';
import {SMALL_TITLE} from '../../help/help';
import {type BuildArgs} from '../../types/build';
import {buildJavaScript, buildTypeScript} from './build.javascript';
import {buildRust} from './build.rust.services';

export const build = async (args?: string[]) => {
  const {watch, ...params} = buildArgs(args);

  if (nonNullish(watch) && watch !== false) {
    watchBuild({watch, ...params});
    return;
  }

  await executeBuild(params);
};

const executeBuild = async ({lang, path}: Omit<BuildArgs, 'watch'>) => {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (lang) {
    case 'rs':
      await buildRust({path});
      return;
    case 'ts':
      await buildTypeScript({path});
      return;
    case 'mjs':
      await buildJavaScript({path});
      return;
  }

  const isPathToml =
    nonNullish(path) && basename(path) === basename(DEVELOPER_PROJECT_SATELLITE_CARGO_TOML);

  if (isPathToml) {
    await buildRust({path});
    return;
  }

  const isPathTypeScript =
    nonNullish(path) && extname(path) === extname(DEVELOPER_PROJECT_SATELLITE_INDEX_TS);

  if (isPathTypeScript) {
    await buildTypeScript({path});
    return;
  }

  const isPathJavaScript =
    nonNullish(path) && extname(path) === extname(DEVELOPER_PROJECT_SATELLITE_INDEX_MJS);

  if (isPathJavaScript) {
    await buildJavaScript({path});
    return;
  }

  if (existsSync(DEVELOPER_PROJECT_SATELLITE_CARGO_TOML)) {
    await buildRust();
    return;
  }

  if (existsSync(DEVELOPER_PROJECT_SATELLITE_INDEX_TS)) {
    await buildTypeScript();
    return;
  }

  if (existsSync(DEVELOPER_PROJECT_SATELLITE_INDEX_MJS)) {
    await buildJavaScript();
    return;
  }

  console.log(
    red(
      'No source found for Satellite serverless functions. Expected a Rust, TypeScript, or JavaScript project.'
    )
  );
};

const watchBuild = ({watch, path, ...params}: BuildArgs) => {
  const doBuild = async () => {
    console.log(`\n⏱ Rebuilding serverless functions...`);
    await executeBuild({path, ...params});
  };

  const DEFAULT_TIMEOUT = 10_000;
  const timeout =
    nonNullish(watch) && typeof watch === 'string' ? parseInt(watch) : DEFAULT_TIMEOUT;

  const debounceBuild = debounce(doBuild, !isNaN(timeout) ? timeout : DEFAULT_TIMEOUT);

  const watchOnEvent = () => {
    debounceBuild();
  };

  const watchPath = nonNullish(path) ? dirname(path) : DEVELOPER_PROJECT_SATELLITE_PATH;

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

const buildArgs = (args?: string[]): BuildArgs => {
  const path = nextArg({args, option: '-p'}) ?? nextArg({args, option: '--path'});

  const {lang} = buildLang(args);

  const watch = hasArgs({args, options: ['-w', '--watch']});
  const watchValue = nextArg({args, option: '-w'}) ?? nextArg({args, option: '--watch'});

  return {
    path,
    lang,
    watch: watchValue ?? watch
  };
};

const buildLang = (args?: string[]): Pick<BuildArgs, 'lang'> => {
  const lang = nextArg({args, option: '-l'}) ?? nextArg({args, option: '--lang'});

  switch (lang?.toLowerCase()) {
    case 'rs':
    case 'rust':
      return {lang: 'rs'};
    case 'ts':
    case 'mts':
    case 'typescript':
      return {lang: 'ts'};
    case 'js':
    case 'mjs':
    case 'javascript':
      return {lang: 'mjs'};
    default:
      return {};
  }
};
