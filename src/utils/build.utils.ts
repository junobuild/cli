import {notEmptyString} from '@dfinity/utils';
import {hasArgs, nextArg} from '@junobuild/cli-tools';
import type {BuildArgs} from '../types/build';

export const buildArgs = (args?: string[]): BuildArgs => {
  const cargoPath = nextArg({args, option: '--cargo-path'});
  const sourcePath = nextArg({args, option: '--source-path'});

  const {lang} = buildLang(args);

  const watch = hasArgs({args, options: ['-w', '--watch']});
  const watchValue = nextArg({args, option: '-w'}) ?? nextArg({args, option: '--watch'});

  return {
    ...((notEmptyString(cargoPath) || notEmptyString(sourcePath)) && {
      paths: {cargo: cargoPath, source: sourcePath}
    }),
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
