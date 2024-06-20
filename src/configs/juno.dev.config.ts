import type {ConfigFilename} from '@junobuild/config-loader';
import {
  junoConfigExist as junoConfigExistTools,
  junoConfigFile as junoConfigFileTools
} from '@junobuild/config-loader';
import {JUNO_DEV_CONFIG_FILENAME} from '../constants/constants';
import type {ConfigType} from '../types/config';

const JUNO_DEV_CONFIG_FILE: {filename: ConfigFilename} = {filename: JUNO_DEV_CONFIG_FILENAME};

export const junoDevConfigExist = async (): Promise<boolean> => {
  return await junoConfigExistTools(JUNO_DEV_CONFIG_FILE);
};

export const junoDevConfigFile = (): {configPath: string; configType: ConfigType} =>
  junoConfigFileTools(JUNO_DEV_CONFIG_FILE);
