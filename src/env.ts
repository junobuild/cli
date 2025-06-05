import {nextArg} from '@junobuild/cli-tools';
import type {JunoConfigEnv} from '@junobuild/config';

export type JunoCliEnv = JunoConfigEnv & {
  containerUrl: string | undefined;
};

const loadEnv = (): JunoCliEnv => {
  const [_, ...args] = process.argv.slice(2);

  const mode = nextArg({args, option: '-m'}) ?? nextArg({args, option: '--mode'});
  const containerUrl = nextArg({args, option: '--container-url'});

  return {
    mode: mode ?? 'production',
    containerUrl: containerUrl ?? (mode === 'development' ? 'http://127.0.0.1:5987' : undefined)
  };
};

export const ENV = loadEnv();

export const DEV = ENV.mode === 'development';
