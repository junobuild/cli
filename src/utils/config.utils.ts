import {nonNullish} from '@dfinity/utils';
import {nextArg} from '@junobuild/cli-tools';
import type {JunoConfigEnv} from '@junobuild/config';
import {CLI_PROJECT_NAME} from '../constants/constants';
// TODO: fix TypeScript declaration import of conf
// @ts-expect-error
import Conf, {type Schema} from 'conf';
import type {CliConfig} from '../types/cli.config';

export const configEnv = (args?: string[]): JunoConfigEnv => {
  const mode = nextArg({args, option: '-m'}) ?? nextArg({args, option: '--mode'});
  return {
    mode: mode ?? 'production'
  };
};

export const loadConfig = (encryptionKey: string | undefined): Conf<CliConfig> => {
  const schema: Schema<CliConfig> = {
    token: {
      type: 'array'
    },
    satellites: {
      type: 'array'
    }
  } as const;

  return new Conf<CliConfig>({
    projectName: CLI_PROJECT_NAME,
    schema,
    ...(nonNullish(encryptionKey) && {encryptionKey})
  });
};
