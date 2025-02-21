import type {CliConfig} from '../types/cli.config';
import {CLI_PROJECT_NAME} from './constants';

// TODO: fix TypeScript declaration import of conf
// @ts-expect-error
import type {Options, Schema} from 'conf';

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
const DEFAULT_CONF_OPTIONS: Required<
  Pick<Options<CliConfig>, 'fileExtension' | 'projectSuffix' | 'configName'>
> = {
  configName: 'config',
  projectSuffix: 'nodejs',
  fileExtension: 'json'
};

export const CONFIG_OPTIONS: Required<
  Pick<Options<CliConfig>, 'projectName' | 'schema'> & typeof DEFAULT_CONF_OPTIONS
> = {
  ...DEFAULT_CONF_OPTIONS,
  projectName: CLI_PROJECT_NAME,
  schema
};
