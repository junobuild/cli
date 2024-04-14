import {nextArg} from '@junobuild/cli-tools';
import type {JunoConfigEnv} from '@junobuild/config';

export const configEnv = (args?: string[]): JunoConfigEnv => {
  const mode = nextArg({args, option: '-m'}) ?? nextArg({args, option: '--mode'});
  return {
    mode: mode ?? 'production'
  };
};
