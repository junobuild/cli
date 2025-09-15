import {assertNonNullish, nonNullish} from '@dfinity/utils';
import type Conf from 'conf';
import {red, yellow} from 'kleur';
import {askForPassword} from '../services/cli.settings.services';
import {getSettingsStore} from '../stores/settings.store';
import type {CliConfig, CliOrbiterConfig, CliSatelliteConfig} from '../types/cli.config';
import type {JsonnableEd25519KeyIdentity} from '../types/identity';
import {loadConfig} from '../utils/config.utils';

// Save in https://github.com/sindresorhus/env-paths#pathsconfig

let config: Conf<CliConfig> | undefined = undefined;

const initConfig = async () => {
  if (nonNullish(config)) {
    return;
  }

  const settingsStore = await getSettingsStore();

  const encryptionKey = settingsStore.isEncryptionEnabled() ? await askForPassword() : undefined;

  try {
    config = loadConfig(encryptionKey);
  } catch (_: unknown) {
    console.log(red('Your current configuration cannot be read.'));

    if (settingsStore.isEncryptionEnabled()) {
      console.log(yellow('\nDid you enter an incorrect password? 🤔'));
    }

    process.exit(1);
  }
};

export const saveCliConfig = async ({
  token,
  satellites,
  orbiters,
  missionControl
}: {
  token: JsonnableEd25519KeyIdentity;
  satellites: CliSatelliteConfig[];
  orbiters: CliOrbiterConfig[] | null;
  missionControl: string | null;
}) => {
  await saveToken(token);
  await saveCliSatellites(satellites);

  if (orbiters !== null) {
    await saveCliOrbiters(orbiters);
  }

  if (missionControl !== null) {
    await saveCliMissionControl(missionControl);
  }
};

// Token

const saveToken = async (token: JsonnableEd25519KeyIdentity) => {
  await initConfig();

  // Guard for TypeScript. initConfig ensures config is initialized or exit.
  assertNonNullish(config);

  config.set('token', token);
};

export const getToken = async (): Promise<JsonnableEd25519KeyIdentity | undefined> => {
  await initConfig();

  return config?.get('token');
};

// Satellites

const saveCliSatellites = async (satellites: CliSatelliteConfig[]) => {
  await initConfig();

  // Guard for TypeScript. initConfig ensures config is initialized or exit.
  assertNonNullish(config);

  config.set('satellites', satellites);
};

export const getCliSatellites = async (): Promise<CliSatelliteConfig[]> => {
  await initConfig();

  // Guard for TypeScript. initConfig ensures config is initialized or exit.
  assertNonNullish(config);

  return config.get('satellites');
};

export const addCliSatellite = async ({satellite}: {satellite: CliSatelliteConfig}) => {
  const currentSatellites = await getCliSatellites();
  await saveCliSatellites([
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    ...(currentSatellites ?? []).filter(({p}) => p !== satellite.p),
    satellite
  ]);
};

// Mission control

const saveCliMissionControl = async (missionControl: string) => {
  await initConfig();

  // Guard for TypeScript. initConfig ensures config is initialized or exit.
  assertNonNullish(config);

  config.set('missionControl', missionControl);
};

export const getCliMissionControl = async (): Promise<string | undefined> => {
  await initConfig();

  return config?.get('missionControl');
};

export const addCliMissionControl = async ({missionControl}: {missionControl: string}) => {
  await saveCliMissionControl(missionControl);
};

// Orbiters

const saveCliOrbiters = async (orbiters: CliOrbiterConfig[]) => {
  await initConfig();

  // Guard for TypeScript. initConfig ensures config is initialized or exit.
  assertNonNullish(config);

  config.set('orbiters', orbiters);
};

export const getCliOrbiters = async (): Promise<CliOrbiterConfig[] | undefined> => {
  await initConfig();

  return config?.get('orbiters');
};

export const addCliOrbiter = async ({orbiter}: {orbiter: CliOrbiterConfig}) => {
  const currentOrbiters = await getCliOrbiters();
  await saveCliOrbiters([...(currentOrbiters ?? []).filter(({p}) => p !== orbiter.p), orbiter]);
};

// Clear

export const clearCliConfig = async () => {
  await initConfig();

  // Guard for TypeScript. initConfig ensures config is initialized or exit.
  assertNonNullish(config);

  config.clear();
};
