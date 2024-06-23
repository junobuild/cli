import type {ConfigFilename} from '@junobuild/config-loader';
import {
  junoConfigExist as junoConfigExistTools,
  junoConfigFile as junoConfigFileTools
} from '@junobuild/config-loader';
import type {ConfigFile} from '@junobuild/config-loader/dist/types/types/config';
import {JUNO_DEV_CONFIG_FILENAME} from '../constants/constants';

const JUNO_DEV_CONFIG_FILE: {filename: ConfigFilename} = {filename: JUNO_DEV_CONFIG_FILENAME};

export const junoDevConfigExist = async (): Promise<boolean> => {
  return await junoConfigExistTools(JUNO_DEV_CONFIG_FILE);
};

export const junoDevConfigFile = (): ConfigFile => junoConfigFileTools(JUNO_DEV_CONFIG_FILE);
