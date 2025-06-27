import {EmulatorConfig, EmulatorConfigSchema} from '@junobuild/config';
import {red} from 'kleur';
import {EMULATOR_SATELLITE, EMULATOR_SKYLAB} from '../constants/emulator.constants';
import {ENV} from '../env';
import type {CliEmulatorConfig} from '../types/emulator';
import {readPackageJson} from '../utils/pkg.utils';
import {junoConfigExist, readJunoConfig} from './juno.config';
import {junoDevConfigExist} from './juno.dev.config';
import {join} from 'node:path';

export const readEmulatorConfig = async (): Promise<
  | {
      success: true;
      config: CliEmulatorConfig;
    }
  | {success: false}
> => {
  const config = await getEmulatorConfig();

  const {success} = EmulatorConfigSchema.safeParse(config);
  if (!success) {
    console.log(
      red('Invalid configuration: please check the emulator options of your config file.')
    );
    return {success: false};
  }

  const emulatorType =
    'satellite' in config ? 'satellite' : 'console' in config ? 'console' : 'skylab';

  const containerName = normalizeContainerName(
    config.runner?.name ?? (await readProjectName()) ?? `juno-${emulatorType}`
  );

  const runner = config.runner?.type ?? 'docker';

  const targetDeploy = config.runner?.target ?? join(process.cwd(), 'target', 'deploy');

  return {
    success: true,
    config: {
      config,
      derivedConfig: {
        containerName,
        emulatorType,
        runner,
        targetDeploy
      }
    }
  };
};

const normalizeContainerName = (pkgName: string): string =>
  pkgName
    .replace(/^@[^/]+\//, '')
    .replace(/[^a-zA-Z0-9_.-]/g, '-')
    .replace(/^[^a-zA-Z0-9]+/, '')
    .toLowerCase();

const readProjectName = async (): Promise<string | undefined> => {
  try {
    const {name} = await readPackageJson();
    return name;
  } catch (_err: unknown) {
    // This should not block the developer therefore we fallback to core which is the common way of using the library
    return undefined;
  }
};

const getEmulatorConfig = async (): Promise<EmulatorConfig> => {
  const configExist = await junoConfigExist();
  const devConfigExist = await junoDevConfigExist();

  if (!configExist && !devConfigExist) {
    return {skylab: EMULATOR_SKYLAB};
  }

  if (!configExist && devConfigExist) {
    return {satellite: EMULATOR_SATELLITE};
  }

  const config = await readJunoConfig(ENV);
  return config.emulator ?? {skylab: EMULATOR_SKYLAB};
};
