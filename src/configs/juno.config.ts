import type {JunoConfigFnOrObject} from '@junobuild/cli-config';
import {existsSync} from 'node:fs';
import {access, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {JUNO_CONFIG_FILENAME} from '../constants/constants';
import type {JunoConfig, OrbiterConfig, SatelliteConfig} from '../types/juno.config';
import {nodeRequire} from '../utils/node.utils';

export const saveSatelliteConfig = async (satellite: SatelliteConfig): Promise<void> => {
  if (await junoConfigExist()) {
    const existingConfig = await readJunoConfig();
    await writeJunoConfig({
      ...existingConfig,
      satellite
    });
    return;
  }

  await writeJunoConfig({satellite});
};

export const saveOrbiterConfig = async (orbiter: OrbiterConfig): Promise<void> => {
  if (!(await junoConfigExist())) {
    throw new Error(`No juno.json configuration file has been initialized yet.`);
  }

  const existingConfig = await readJunoConfig();
  await writeJunoConfig({
    ...existingConfig,
    orbiter
  });
};

export const readSatelliteConfig = async (): Promise<SatelliteConfig> => {
  const {satellite} = await readJunoConfig();
  return satellite;
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

const junoConfigFile = (): {configPath: string; configType: 'ts' | 'js' | 'json'} => {
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

  return {
    configPath: join(process.cwd(), `${JUNO_CONFIG_FILENAME}.json`),
    configType: 'json'
  };
};

// TODO
const writeJunoConfig = async (config: JunoConfig): Promise<void> => {
  await writeFile(JUNO_CONFIG_FILENAME, JSON.stringify(config, null, 2), 'utf-8');
};

const readJunoConfig = async (): Promise<JunoConfig> => {
  const {configPath, configType} = junoConfigFile();

  switch (configType) {
    case 'ts': {
      const userConfig = nodeRequire<JunoConfigFnOrObject>(configPath).default;
      const config =
        typeof userConfig === 'function' ? userConfig({mode: 'production'}) : userConfig;

      console.log('Config', config);

      return config;
    }
    case 'js': {
      const modJs = await import(configPath);
      return modJs.default;
    }
    default: {
      const buffer = await readFile(configPath);
      return JSON.parse(buffer.toString('utf-8'));
    }
  }
};
