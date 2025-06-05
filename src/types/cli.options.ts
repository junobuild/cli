import type {Options as ConfOptions} from 'conf';
import {type CliConfig} from './cli.config';

type CliConfigRequiredOptions = Required<ConfOptions<CliConfig>>;

export type CliDefaultOptions = Pick<
  CliConfigRequiredOptions,
  'fileExtension' | 'projectSuffix' | 'configName'
>;

// TODO: We do not inherit the type of projectName from RequiredOptions because somehow TypeScript does not checks it's a defined string once made required
export type CliOptions = {projectName: string} & Pick<CliConfigRequiredOptions, 'schema'> &
  CliDefaultOptions;
