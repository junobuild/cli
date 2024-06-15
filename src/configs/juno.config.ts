import {
  DEPLOY_DEFAULT_SOURCE,
  junoConfigExist as junoConfigExistTools,
  junoConfigFile as junoConfigFileTools,
  readJunoConfig as readJunoConfigTools,
  type ConfigFilename
} from '@junobuild/cli-tools';
import type {JunoConfig, JunoConfigEnv, JunoConfigFnOrObject} from '@junobuild/config';
import {nonNullish} from '@junobuild/utils';
import {writeFile} from 'node:fs/promises';
import {
  TEMPLATE_INIT_PATH,
  TEMPLATE_SATELLITE_CONFIG_FILENAME
} from '../constants/config.constants';
import {JUNO_CONFIG_FILENAME} from '../constants/constants';
import type {ConfigType, JunoConfigWithSatelliteId} from '../types/config';
import {readTemplateFile} from '../utils/fs.utils';

const JUNO_CONFIG_FILE: {filename: ConfigFilename} = {filename: JUNO_CONFIG_FILENAME};

export const junoConfigExist = async (): Promise<boolean> => {
  return await junoConfigExistTools(JUNO_CONFIG_FILE);
};

export const junoConfigFile = (): {configPath: string; configType: ConfigType} =>
  junoConfigFileTools(JUNO_CONFIG_FILE);

export const writeJunoConfig = async ({
  config,
  configType
}: {
  config: JunoConfigWithSatelliteId;
  configType: ConfigType;
}): Promise<void> => {
  switch (configType) {
    case 'ts':
    case 'js': {
      const {
        orbiter,
        satellite: {id, source}
      } = config;

      const template = await readTemplateFile({
        template: nonNullish(orbiter)
          ? `${JUNO_CONFIG_FILENAME}.${configType}`
          : `${TEMPLATE_SATELLITE_CONFIG_FILENAME}.${configType}`,
        sourceFolder: TEMPLATE_INIT_PATH
      });

      const content = template
        .replace('<SATELLITE_ID>', id)
        .replace('<SOURCE>', source ?? DEPLOY_DEFAULT_SOURCE)
        .replace('<ORBITER_ID>', orbiter?.id ?? '');

      await writeFile(`${JUNO_CONFIG_FILENAME}.${configType}`, content, 'utf-8');
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
