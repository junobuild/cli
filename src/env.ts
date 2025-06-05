import {nextArg} from '@junobuild/cli-tools';
import type {JunoConfigEnv} from '@junobuild/config';

const loadEnv = (): JunoConfigEnv => {
  const [_, ...args] = process.argv.slice(2);

  const mode = nextArg({args, option: '-m'}) ?? nextArg({args, option: '--mode'});

  return {
    mode: mode ?? 'production'
  };
};

export const ENV = loadEnv();
