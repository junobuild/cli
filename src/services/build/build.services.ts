import {nonNullish} from '@dfinity/utils';
import {nextArg} from '@junobuild/cli-tools';
import {red} from 'kleur';
import {existsSync} from 'node:fs';
import {basename, extname} from 'node:path';
import {
  DEVELOPER_PROJECT_SATELLITE_CARGO_TOML,
  DEVELOPER_PROJECT_SATELLITE_INDEX_MJS,
  DEVELOPER_PROJECT_SATELLITE_INDEX_TS
} from '../../constants/dev.constants';
import {buildJavaScript, buildTypeScript} from './build.javascript';
import {buildRust} from './build.rust.services';

export const build = async (args?: string[]) => {
  const path = nextArg({args, option: '-p'}) ?? nextArg({args, option: '--path'});

  const lang = nextArg({args, option: '-l'}) ?? nextArg({args, option: '--lang'});

  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (lang?.toLowerCase()) {
    case 'rs':
    case 'rust':
      await buildRust({path});
      return;
    case 'ts':
    case 'typescript':
      await buildTypeScript({path});
      return;
    case 'js':
    case 'javascript':
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
