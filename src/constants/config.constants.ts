import type {Schema} from 'conf';
import {ENV} from '../env';
import {type CliConfig} from '../types/cli.config';
import {type CliDefaultOptions, type CliOptions} from '../types/cli.options';

const schema: Schema<CliConfig> = {
  token: {
    type: 'array'
  },
  satellites: {
    type: 'array'
  }
} as const;

// Default Conf option we inherited and which are now those we are using.
// https://github.com/sindresorhus/conf/blob/184fc278736dee34c44d4e7fa7e1b2a16ffdd5be/source/index.ts#L65
const DEFAULT_CONF_OPTIONS: CliDefaultOptions = {
  configName: 'config',
  projectSuffix: 'nodejs',
  fileExtension: 'json'
};

export const CONFIG_OPTIONS: CliOptions = {
  ...DEFAULT_CONF_OPTIONS,
  projectName: ENV.config.projectName,
  schema
};
