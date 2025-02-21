import type {CliConfig} from '../types/cli.config';
import {CLI_PROJECT_NAME} from './constants';

// TODO: fix TypeScript declaration import of conf
// @ts-expect-error
import type {Options as ConfOptions, Schema} from 'conf';

const schema: Schema<CliConfig> = {
  token: {
    type: 'array'
  },
  satellites: {
    type: 'array'
  }
} as const;

type RequiredOptions = Required<ConfOptions<CliConfig>>;

type DefaultOptions = Pick<RequiredOptions, 'fileExtension' | 'projectSuffix' | 'configName'>;

// Default Conf option we inherited and which are now those we are using.
// https://github.com/sindresorhus/conf/blob/184fc278736dee34c44d4e7fa7e1b2a16ffdd5be/source/index.ts#L65
const DEFAULT_CONF_OPTIONS: DefaultOptions = {
  configName: 'config',
  projectSuffix: 'nodejs',
  fileExtension: 'json'
};

// TODO: We do not inherit the type of projectName from RequiredOptions because somehow TypeScript does not checks it's a defined string once made required
export type Options = {projectName: string} & Pick<RequiredOptions, 'schema'> & DefaultOptions;

export const CONFIG_OPTIONS: Options = {
  ...DEFAULT_CONF_OPTIONS,
  projectName: CLI_PROJECT_NAME,
  schema
};
