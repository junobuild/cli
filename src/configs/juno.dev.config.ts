import {existsSync} from 'node:fs';
import {access} from 'node:fs/promises';
import {join} from 'node:path';
import {JUNO_DEV_CONFIG_FILENAME, JUNO_DEV_JSON} from '../constants/constants';
import type {ConfigType} from '../types/config';

export const junoDevConfigExist = async (): Promise<boolean> => {
  try {
    const {configPath} = junoDevConfigFile();
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

export const junoDevConfigFile = (): {configPath: string; configType: ConfigType} => {
  const junoTs = join(process.cwd(), `${JUNO_DEV_CONFIG_FILENAME}.ts`);

  if (existsSync(junoTs)) {
    return {
      configPath: junoTs,
      configType: 'ts'
    };
  }

  const junoJs = join(process.cwd(), `${JUNO_DEV_CONFIG_FILENAME}.js`);

  if (existsSync(junoJs)) {
    return {
      configPath: junoJs,
      configType: 'js'
    };
  }

  const junoMjs = join(process.cwd(), `${JUNO_DEV_CONFIG_FILENAME}.mjs`);

  if (existsSync(junoMjs)) {
    return {
      configPath: junoMjs,
      configType: 'js'
    };
  }

  const junoCjs = join(process.cwd(), `${JUNO_DEV_CONFIG_FILENAME}.cjs`);

  if (existsSync(junoCjs)) {
    return {
      configPath: junoCjs,
      configType: 'js'
    };
  }

  // Support for original juno.json file
  const junoJsonDeprecated = join(process.cwd(), JUNO_DEV_JSON);

  if (existsSync(junoJsonDeprecated)) {
    return {
      configPath: junoJsonDeprecated,
      configType: 'json'
    };
  }

  return {
    configPath: join(process.cwd(), `${JUNO_DEV_CONFIG_FILENAME}.json`),
    configType: 'json'
  };
};
