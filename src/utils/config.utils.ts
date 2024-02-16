import type {JunoConfigEnv} from '@junobuild/config';
import {nextArg} from './args.utils';

export const configEnv = (args?: string[]): JunoConfigEnv => {
  const mode = nextArg({args, option: '-m'}) ?? nextArg({args, option: '--mode'});
  return {
    mode: mode ?? 'production'
  };
};
