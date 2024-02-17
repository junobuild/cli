import type {JunoConfig, JunoConfigEnv, JunoConfigFnOrObject} from '@junobuild/config';
import {nonNullish} from '@junobuild/utils';
import {existsSync} from 'node:fs';
import {access, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {
  TEMPLATE_INIT_PATH,
  TEMPLATE_SATELLITE_CONFIG_FILENAME
} from '../constants/config.constants';
import {JUNO_CONFIG_FILENAME, JUNO_JSON} from '../constants/constants';
import {DEPLOY_DEFAULT_SOURCE} from '../constants/deploy.constants';
import type {ConfigType, JunoConfigWithSatelliteId} from '../types/config';
import {readTemplateFile} from '../utils/fs.utils';
import {nodeRequire} from '../utils/node.utils';

export const saveJunoConfig = async ({
  config,
  configType
}: {
  config: JunoConfigWithSatelliteId;
  configType: ConfigType;
}): Promise<void> => {
  await writeJunoConfig({
    config,
    configType
  });
};

export const junoConfigExist = async (): Promise<boolean> => {
  try {
    const {configPath} = junoConfigFile();
    await access(configPath);
    return true;
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    } else {
      throw err;
    }
  }
};

export const junoConfigFile = (): {configPath: string; configType: ConfigType} => {
  const junoTs = join(process.cwd(), `${JUNO_CONFIG_FILENAME}.ts`);

  if (existsSync(junoTs)) {
    return {
      configPath: junoTs,
      configType: 'ts'
    };
  }

  const junoJs = join(process.cwd(), `${JUNO_CONFIG_FILENAME}.js`);

  if (existsSync(junoJs)) {
    return {
      configPath: junoJs,
      configType: 'js'
    };
  }

  const junoMjs = join(process.cwd(), `${JUNO_CONFIG_FILENAME}.mjs`);

  if (existsSync(junoMjs)) {
    return {
      configPath: junoMjs,
      configType: 'js'
    };
  }

  const junoCjs = join(process.cwd(), `${JUNO_CONFIG_FILENAME}.cjs`);

  if (existsSync(junoCjs)) {
    return {
      configPath: junoCjs,
      configType: 'js'
    };
  }

  // Support for original juno.json file
  const junoJsonDeprecated = join(process.cwd(), JUNO_JSON);

  if (existsSync(junoJsonDeprecated)) {
    return {
      configPath: junoJsonDeprecated,
      configType: 'json'
    };
  }

  return {
    configPath: join(process.cwd(), `${JUNO_CONFIG_FILENAME}.json`),
    configType: 'json'
  };
};

const writeJunoConfig = async ({
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
        satellite: {satelliteId, source}
      } = config;

      const template = await readTemplateFile({
        template: nonNullish(orbiter)
          ? `${JUNO_CONFIG_FILENAME}.${configType}`
          : `${TEMPLATE_SATELLITE_CONFIG_FILENAME}.${configType}`,
        sourceFolder: TEMPLATE_INIT_PATH
      });

      const content = template
        .replace('<SATELLITE_ID>', satelliteId)
        .replace('<SOURCE>', source ?? DEPLOY_DEFAULT_SOURCE)
        .replace('<ORBITER_ID>', orbiter?.orbiterId ?? '');

      await writeFile(`${JUNO_CONFIG_FILENAME}.${configType}`, content, 'utf-8');
      break;
    }
    default: {
      await writeFile(`${JUNO_CONFIG_FILENAME}.json`, JSON.stringify(config, null, 2), 'utf-8');
    }
  }
};

export const readJunoConfig = async (env: JunoConfigEnv): Promise<JunoConfig> => {
  const {configPath, configType} = junoConfigFile();

  const config = (userConfig: JunoConfigFnOrObject): JunoConfig =>
    typeof userConfig === 'function' ? userConfig(env) : userConfig;

  switch (configType) {
    case 'ts': {
      const {default: userConfig} = nodeRequire<JunoConfigFnOrObject>(configPath);
      return config(userConfig);
    }
    case 'js': {
      const {default: userConfig} = await import(configPath);
      return config(userConfig as JunoConfigFnOrObject);
    }
    default: {
      const buffer = await readFile(configPath);
      return JSON.parse(buffer.toString('utf-8'));
    }
  }
};
