import type {JsonnableEd25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';
// TODO: fix TypeScript declaration import of conf
// @ts-expect-error
import Conf, {type Schema} from 'conf';
import {CLI_PROJECT_NAME} from '../constants/constants';

interface CliConfigData {
  token: JsonnableEd25519KeyIdentity;
  satellites: CliSatelliteConfig[];
  missionControl?: string;
  orbiters?: CliOrbiterConfig[];
}

export interface CliSatelliteConfig {
  p: string; // principal
  n: string; // name
}

export interface CliOrbiterConfig {
  p: string; // principal
  n?: string; // name
}

export type CliProfile = 'default' | string;

// Backwards compatibility. Default is save in root of the object, profile in an optional record.
interface CliConfig extends CliConfigData {
  use?: CliProfile;
  profiles?: Record<string, CliConfigData>;
}

const schema: Schema<CliConfig> = {
  token: {
    type: 'array'
  },
  satellites: {
    type: 'array'
  }
} as const;

// Save in https://github.com/sindresorhus/env-paths#pathsconfig
const config = new Conf<CliConfig>({projectName: CLI_PROJECT_NAME, schema});

export const saveCliConfig = ({
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
    const profiles = getProfiles();

    saveProfiles({
      ...(profiles !== undefined ? profiles : {}),
      [profile!]: {
        token,
        satellites,
        ...(orbiters !== null && {orbiters}),
        ...(missionControl !== null && {missionControl})
      }
    });

    saveUse(profile!);

    return;
  }

  saveToken(token);
  saveCliSatellites(satellites);

  if (orbiters !== null) {
    saveCliOrbiters(orbiters);
  }

  if (missionControl !== null) {
    saveCliMissionControl(missionControl);
  }

  deleteUse();
};

// Use / profile

export const deleteUse = () => config.delete('use');
export const saveUse = (use: CliProfile) => config.set('use', use);
export const getUse = (): CliProfile | undefined => config.get('use');

// Profile

export const saveProfiles = (profiles: Record<string, CliConfigData>) =>
  config.set('profiles', profiles);

export const getProfiles = (): Record<string, CliConfigData> | undefined => config.get('profiles');

export const isDefaultProfile = (use: CliProfile | undefined | null): boolean =>
  use === null || use === undefined || use === 'default';

// Token

const saveToken = (token: JsonnableEd25519KeyIdentity) => config.set('token', token);

export const getToken = (): JsonnableEd25519KeyIdentity | undefined => {
  const use = getUse();

  if (!isDefaultProfile(use)) {
    return getProfiles()?.[use!]?.token;
  }

  return config.get('token');
};

// Satellites

const saveCliSatellites = (satellites: CliSatelliteConfig[]) =>
  config.set('satellites', satellites);

export const getCliSatellites = (): CliSatelliteConfig[] => {
  const use = getUse();

  if (!isDefaultProfile(use)) {
    return getProfiles()?.[use!]?.satellites ?? [];
  }

  return config.get('satellites');
};

export const addCliSatellite = ({
  satellite,
  profile
}: {
  satellite: CliSatelliteConfig;
  profile: CliProfile | undefined;
}) => {
  if (!isDefaultProfile(profile)) {
    const profiles = getProfiles();
    const currentProfile = profiles?.[profile!];

    if (currentProfile === undefined) {
      throw new Error(`The profile must exist.`);
    }

    saveProfiles({
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

  const currentSatellites = getCliSatellites();
  saveCliSatellites([...(currentSatellites ?? []).filter(({p}) => p !== satellite.p), satellite]);
};

// Mission control

const saveCliMissionControl = (missionControl: string) =>
  config.set('missionControl', missionControl);

export const getCliMissionControl = (): string | undefined => {
  const use = getUse();

  if (!isDefaultProfile(use)) {
    return getProfiles()?.[use!]?.missionControl;
  }

  return config.get('missionControl');
};

export const addCliMissionControl = ({
  missionControl,
  profile
}: {
  missionControl: string;
  profile: CliProfile | undefined;
}) => {
  if (!isDefaultProfile(profile)) {
    const profiles = getProfiles();
    const currentProfile = profiles?.[profile!];

    if (currentProfile === undefined) {
      throw new Error(`The profile must exist.`);
    }

    saveProfiles({
      ...(profiles !== undefined ? profiles : {}),
      [profile!]: {
        ...currentProfile,
        missionControl
      }
    });

    return;
  }

  saveCliMissionControl(missionControl);
};

// Orbiters

const saveCliOrbiters = (orbiters: CliOrbiterConfig[]) => config.set('orbiters', orbiters);

export const getCliOrbiters = (): CliOrbiterConfig[] | undefined => {
  const use = getUse();

  if (!isDefaultProfile(use)) {
    return getProfiles()?.[use!]?.orbiters;
  }

  return config.get('orbiters');
};

export const addCliOrbiter = ({
  orbiter,
  profile
}: {
  orbiter: CliOrbiterConfig;
  profile: CliProfile | undefined;
}) => {
  if (!isDefaultProfile(profile)) {
    const profiles = getProfiles();
    const currentProfile = profiles?.[profile!];

    if (currentProfile === undefined) {
      throw new Error(`The profile must exist.`);
    }

    saveProfiles({
      ...(profiles !== undefined ? profiles : {}),
      [profile!]: {
        ...currentProfile,
        orbiters: [...(currentProfile.orbiters ?? []).filter(({p}) => p !== orbiter.p), orbiter]
      }
    });

    return;
  }

  const currentOrbiters = getCliOrbiters();
  saveCliOrbiters([...(currentOrbiters ?? []).filter(({p}) => p !== orbiter.p), orbiter]);
};

// Clear

export const clearCliConfig = () => config.clear();
