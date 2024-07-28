import type {JsonnableEd25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';
import {nonNullish} from '@junobuild/utils';
// TODO: fix TypeScript declaration import of conf
// @ts-expect-error
import type Conf from 'conf';
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
let config: Conf<CliConfig> | undefined;

const initConfig = async () => {
  if (nonNullish(config)) {
    return;
  }

  const encryptionKey = settingsStore.useEncryption() ? await askForPassword() : undefined;

  config = loadConfig(encryptionKey);
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

  return config.get('use');
};

// Profile

const saveProfiles = async (profiles: Record<string, CliConfigData>) => {
  await initConfig();

  config.set('profiles', profiles);
};

export const getProfiles = async (): Promise<Record<string, CliConfigData> | undefined> => {
  await initConfig();

  return config.get('profiles');
};

export const isDefaultProfile = (use: CliProfile | undefined | null): boolean =>
  use === null || use === undefined || use === 'default';

// Token

const saveToken = async (token: JsonnableEd25519KeyIdentity) => {
  await initConfig();

  config.set('token', token);
};

export const getToken = async (): Promise<JsonnableEd25519KeyIdentity | undefined> => {
  const use = await getUse();

  if (!isDefaultProfile(use)) {
    return (await getProfiles())?.[use!]?.token;
  }

  return config.get('token');
};

// Satellites

const saveCliSatellites = async (satellites: CliSatelliteConfig[]) => {
  await initConfig();

  await config.set('satellites', satellites);
};

export const getCliSatellites = async (): Promise<CliSatelliteConfig[]> => {
  const use = await getUse();

  if (!isDefaultProfile(use)) {
    return (await getProfiles())?.[use!]?.satellites ?? [];
  }

  return config.get('satellites');
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
          ...(currentProfile.satellites ?? []).filter(({p}) => p !== satellite.p),
          satellite
        ]
      }
    });

    return;
  }

  const currentSatellites = await getCliSatellites();
  await saveCliSatellites([
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

  return config.get('missionControl');
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
  const use = await getUse();

  if (!isDefaultProfile(use)) {
    return (await getProfiles())?.[use!]?.orbiters;
  }

  return config.get('orbiters');
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

export const clearCliConfig = () => config.clear();
