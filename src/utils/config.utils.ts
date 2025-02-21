import {nonNullish} from '@dfinity/utils';
import {nextArg} from '@junobuild/cli-tools';
import type {JunoConfigEnv} from '@junobuild/config';
import envPaths from 'env-paths';
import {resolve} from 'node:path';
import {CONFIG_OPTIONS} from '../constants/config.constants';
import type {CliConfig} from '../types/cli.config';

// TODO: fix TypeScript declaration import of conf
// @ts-expect-error
import Conf from 'conf';
import {existsSync} from 'node:fs';

export const configEnv = (args?: string[]): JunoConfigEnv => {
  const mode = nextArg({args, option: '-m'}) ?? nextArg({args, option: '--mode'});
  return {
    mode: mode ?? 'production'
  };
};

export const loadConfig = (encryptionKey: string | undefined): Conf<CliConfig> => {
  return new Conf<CliConfig>({
    ...CONFIG_OPTIONS,
    ...(nonNullish(encryptionKey) && {encryptionKey})
  });
};

// A copy of the Conf constructor logic to build the path of the configuration file.
// Useful for checking if the file actually exists without loading the config,
// since loading an encrypted file without providing its password throws an exception.
const configPath = (): string => {
  const {projectName, projectSuffix, fileExtension: fileExt, configName} = CONFIG_OPTIONS;

  // Source: https://github.com/sindresorhus/conf/blob/184fc278736dee34c44d4e7fa7e1b2a16ffdd5be/source/index.ts#L80
  const cwd = envPaths(projectName, {suffix: projectSuffix}).config;

  // Source: https://github.com/sindresorhus/conf/blob/184fc278736dee34c44d4e7fa7e1b2a16ffdd5be/source/index.ts#L128
  const fileExtension = nonNullish(fileExt) ? `.${fileExt}` : '';

  return resolve(cwd, `${configName}${fileExtension}`);
};

export const configFileExists = (): boolean => existsSync(configPath());
