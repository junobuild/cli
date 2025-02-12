import type {JsonnableEd25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';
import {nonNullish} from '@dfinity/utils';
// TODO: fix TypeScript declaration import of conf
// @ts-expect-error
import type Conf from 'conf';
import {red, yellow} from 'kleur';
import {askForPassword} from '../services/cli.settings.services';
import {settingsStore} from '../stores/settings.store';
import type {
  CliConfig,
  CliConfigData,
  CliOrbiterConfig,
  CliProfile,
  CliSatelliteConfig
} from '../types/cli.config';
import {loadConfig} from '../utils/config.utils';

// Save in https://github.com/sindresorhus/env-paths#pathsconfig
let config: Conf<CliConfig> | undefined = undefined;

const initConfig = async () => {
  if (nonNullish(config)) {
    return;
  }

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
  missionControl,
  profile
}: {
  token: JsonnableEd25519KeyIdentity;
  satellites: CliSatelliteConfig[];
  orbiters: CliOrbiterConfig[] | null;
  missionControl: string | null;
  profile: CliProfile | null;
}) => {
  if (!isDefaultProfile(profile)) {
    const profiles = await getProfiles();

    await saveProfiles({
      ...(profiles !== undefined ? profiles : {}),
      [profile!]: {
        token,
        satellites,
        ...(orbiters !== null && {orbiters}),
        ...(missionControl !== null && {missionControl})
      }
    });

    await saveUse(profile!);

    return;
  }

  await saveToken(token);
  await saveCliSatellites(satellites);

  if (orbiters !== null) {
    await saveCliOrbiters(orbiters);
  }

  if (missionControl !== null) {
    await saveCliMissionControl(missionControl);
  }

  await deleteUse();
};

// Use / profile

export const deleteUse = async () => {
  await initConfig();

  config.delete('use');
};
export const saveUse = async (use: CliProfile) => {
  await initConfig();

  config.set('use', use);
};
export const getUse = async (): Promise<CliProfile | undefined> => {
  await initConfig();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return config?.get('use');
};

// Profile

const saveProfiles = async (profiles: Record<string, CliConfigData>) => {
  await initConfig();

  config.set('profiles', profiles);
};

export const getProfiles = async (): Promise<Record<string, CliConfigData> | undefined> => {
  await initConfig();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return config?.get('profiles');
};

export const isDefaultProfile = (use: CliProfile | undefined | null): boolean =>
  use === null || use === undefined || use === 'default';

// Token

const saveToken = async (token: JsonnableEd25519KeyIdentity) => {
  await initConfig();

  config.set('token', token);
};

export const getToken = async (): Promise<JsonnableEd25519KeyIdentity | undefined> => {
  await initConfig();

  const use = await getUse();

  if (!isDefaultProfile(use)) {
    return (await getProfiles())?.[use!]?.token;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return config?.get('token');
};

// Satellites

const saveCliSatellites = async (satellites: CliSatelliteConfig[]) => {
  await initConfig();

  await config.set('satellites', satellites);
};

export const getCliSatellites = async (): Promise<CliSatelliteConfig[]> => {
  await initConfig();

  const use = await getUse();

  if (!isDefaultProfile(use)) {
    return (await getProfiles())?.[use!]?.satellites ?? [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return config?.get('satellites');
};

export const addCliSatellite = async ({
  satellite,
  profile
}: {
  satellite: CliSatelliteConfig;
  profile: CliProfile | undefined;
}) => {
  if (!isDefaultProfile(profile)) {
    const profiles = await getProfiles();
    const currentProfile = profiles?.[profile!];

    if (currentProfile === undefined) {
      throw new Error(`The profile must exist.`);
    }

    await saveProfiles({
      ...(profiles !== undefined ? profiles : {}),
      [profile!]: {
        ...currentProfile,
        satellites: [
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          ...(currentProfile.satellites ?? []).filter(({p}) => p !== satellite.p),
          satellite
        ]
      }
    });

    return;
  }

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

  config.set('missionControl', missionControl);
};

export const getCliMissionControl = async (): Promise<string | undefined> => {
  await initConfig();

  const use = await getUse();

  if (!isDefaultProfile(use)) {
    return (await getProfiles())?.[use!]?.missionControl;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return config?.get('missionControl');
};

export const addCliMissionControl = async ({
  missionControl,
  profile
}: {
  missionControl: string;
  profile: CliProfile | undefined;
}) => {
  if (!isDefaultProfile(profile)) {
    const profiles = await getProfiles();
    const currentProfile = profiles?.[profile!];

    if (currentProfile === undefined) {
      throw new Error(`The profile must exist.`);
    }

    await saveProfiles({
      ...(profiles !== undefined ? profiles : {}),
      [profile!]: {
        ...currentProfile,
        missionControl
      }
    });

    return;
  }

  await saveCliMissionControl(missionControl);
};

// Orbiters

const saveCliOrbiters = async (orbiters: CliOrbiterConfig[]) => {
  await initConfig();

  config.set('orbiters', orbiters);
};

export const getCliOrbiters = async (): Promise<CliOrbiterConfig[] | undefined> => {
  await initConfig();

  const use = await getUse();

  if (!isDefaultProfile(use)) {
    return (await getProfiles())?.[use!]?.orbiters;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return config?.get('orbiters');
};

export const addCliOrbiter = async ({
  orbiter,
  profile
}: {
  orbiter: CliOrbiterConfig;
  profile: CliProfile | undefined;
}) => {
  if (!isDefaultProfile(profile)) {
    const profiles = await getProfiles();
    const currentProfile = profiles?.[profile!];

    if (currentProfile === undefined) {
      throw new Error(`The profile must exist.`);
    }

    await saveProfiles({
      ...(profiles !== undefined ? profiles : {}),
      [profile!]: {
        ...currentProfile,
        orbiters: [...(currentProfile.orbiters ?? []).filter(({p}) => p !== orbiter.p), orbiter]
      }
    });

    return;
  }

  const currentOrbiters = await getCliOrbiters();
  await saveCliOrbiters([...(currentOrbiters ?? []).filter(({p}) => p !== orbiter.p), orbiter]);
};

// Clear

export const clearCliConfig = async () => {
  await initConfig();

  config.clear();
};
