import {nonNullish} from '@dfinity/utils';
import {DEPLOY_DEFAULT_SOURCE} from '@junobuild/cli-tools';
import type {JunoConfig, JunoConfigEnv, JunoConfigFnOrObject} from '@junobuild/config';
import {
  detectJunoConfigType as detectJunoConfigTypeTools,
  junoConfigExist as junoConfigExistTools,
  junoConfigFile as junoConfigFileTools,
  readJunoConfig as readJunoConfigTools,
  type ConfigFile,
  type ConfigFilename,
  type PartialConfigFile
} from '@junobuild/config-loader';
import {writeFile} from 'node:fs/promises';
import {JUNO_CONFIG_FILENAME} from '../constants/constants';
import {
  TEMPLATE_INIT_PATH,
  TEMPLATE_JUNO_PREDEPLOY_CONFIG_FILENAME,
  TEMPLATE_SATELLITE_CONFIG_FILENAME,
  TEMPLATE_SATELLITE_PREDEPLOY_CONFIG_FILENAME
} from '../constants/templates.constants';
import {type JunoConfigWithPlaceholder, type JunoConfigWithSatelliteId} from '../types/config';
import type {PackageManager} from '../types/pm';
import {readTemplateFile} from '../utils/fs.utils';

const JUNO_CONFIG_FILE: {filename: ConfigFilename} = {filename: JUNO_CONFIG_FILENAME};

export const junoConfigExist = async (): Promise<boolean> => {
  return await junoConfigExistTools(JUNO_CONFIG_FILE);
};

export const junoConfigFile = (): ConfigFile => junoConfigFileTools(JUNO_CONFIG_FILE);

export const detectJunoConfigType = (): ConfigFile | undefined =>
  detectJunoConfigTypeTools(JUNO_CONFIG_FILE);

export const writeJunoConfigPlaceholder = async ({
  config,
  configType,
  configPath,
  pm
}: {config: JunoConfigWithPlaceholder} & PartialConfigFile & {
    pm: PackageManager | undefined;
  }): Promise<void> => {
  switch (configType) {
    case 'ts':
    case 'js': {
      const {
        satellite: {source}
      } = config;

      const withPredeploy = nonNullish(pm);

      const template = await readTemplateFile({
        template: `${withPredeploy ? TEMPLATE_SATELLITE_PREDEPLOY_CONFIG_FILENAME : TEMPLATE_SATELLITE_CONFIG_FILENAME}.${configType}`,
        sourceFolder: TEMPLATE_INIT_PATH
      });

      const content = template
        .replace('<SOURCE>', source ?? DEPLOY_DEFAULT_SOURCE)
        .replace('<COMMAND>', pm === 'npm' ? 'npm run' : (pm ?? ''));

      await writeFile(configPath ?? `${JUNO_CONFIG_FILENAME}.${configType}`, content, 'utf-8');
      break;
    }
    default: {
      await writeFile(`${JUNO_CONFIG_FILENAME}.json`, JSON.stringify(config, null, 2), 'utf-8');
    }
  }
};

export const writeJunoConfig = async ({
  config,
  configType,
  configPath,
  pm
}: {
  config: JunoConfigWithSatelliteId;
} & PartialConfigFile & {pm: PackageManager | undefined}): Promise<void> => {
  switch (configType) {
    case 'ts':
    case 'js': {
      const {
        orbiter,
        satellite: {id, source}
      } = config;

      const withPredeploy = nonNullish(pm);

      const template = await readTemplateFile({
        template: nonNullish(orbiter)
          ? `${withPredeploy ? TEMPLATE_JUNO_PREDEPLOY_CONFIG_FILENAME : JUNO_CONFIG_FILENAME}.${configType}`
          : `${withPredeploy ? TEMPLATE_SATELLITE_PREDEPLOY_CONFIG_FILENAME : TEMPLATE_SATELLITE_CONFIG_FILENAME}.${configType}`,
        sourceFolder: TEMPLATE_INIT_PATH
      });

      const content = template
        .replace('<SATELLITE_ID>', id)
        .replace('<SOURCE>', source ?? DEPLOY_DEFAULT_SOURCE)
        .replace('<COMMAND>', pm === 'npm' ? 'npm run' : (pm ?? ''))
        .replace('<ORBITER_ID>', orbiter?.id ?? '');

      await writeFile(configPath ?? `${JUNO_CONFIG_FILENAME}.${configType}`, content, 'utf-8');
      break;
    }
    default: {
      await writeFile(`${JUNO_CONFIG_FILENAME}.json`, JSON.stringify(config, null, 2), 'utf-8');
    }
  }
};

export const readJunoConfig = async (env: JunoConfigEnv): Promise<JunoConfig> => {
  const config = (userConfig: JunoConfigFnOrObject): JunoConfig =>
    typeof userConfig === 'function' ? userConfig(env) : userConfig;

  return await readJunoConfigTools({
    ...JUNO_CONFIG_FILE,
    config
  });
};
