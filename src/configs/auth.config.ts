import type {JsonnableEd25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';
// TODO: fix TypeScript declaration import of conf
// @ts-ignore
import Conf, {Schema} from 'conf';
import {AUTH_PROJECT_NAME} from '../constants/constants';

interface AuthConfigData {
  token: JsonnableEd25519KeyIdentity;
  satellites: AuthSatelliteConfig[];
  missionControl?: string;
  orbiters?: AuthOrbiterConfig[];
}

export interface AuthSatelliteConfig {
  p: string; // principal
  n: string; // name
}

export interface AuthOrbiterConfig {
  p: string; // principal
  n?: string; // name
}

export type AuthProfile = 'default' | string;

// Backwards compatibility. Default is save in root of the object, profile in an optional record.
interface AuthConfig extends AuthConfigData {
  use?: AuthProfile;
  profiles?: Record<string, AuthConfigData>;
}

const schema: Schema<AuthConfig> = {
  token: {
    type: 'array'
  },
  satellites: {
    type: 'array'
  }
} as const;

// Save in https://github.com/sindresorhus/env-paths#pathsconfig
const config = new Conf<AuthConfig>({projectName: AUTH_PROJECT_NAME, schema});

export const saveAuthConfig = ({
  token,
  satellites,
  orbiters,
  missionControl,
  profile
}: {
  token: JsonnableEd25519KeyIdentity;
  satellites: AuthSatelliteConfig[];
  orbiters: AuthOrbiterConfig[] | null;
  missionControl: string | null;
  profile: AuthProfile | null;
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
  saveAuthSatellites(satellites);

  if (orbiters !== null) {
    saveAuthOrbiters(orbiters);
  }

  if (missionControl !== null) {
    saveAuthMissionControl(missionControl);
  }

  deleteUse();
};

export const deleteUse = () => config.delete('use');
export const saveUse = (use: AuthProfile) => config.set('use', use);
export const getUse = (): AuthProfile | undefined => config.get('use');

export const saveProfiles = (profiles: Record<string, AuthConfigData>) =>
  config.set('profiles', profiles);
export const getProfiles = (): Record<string, AuthConfigData> | undefined => config.get('profiles');

export const isDefaultProfile = (use: AuthProfile | undefined | null): boolean =>
  use === null || use === undefined || use === 'default';

const saveToken = (token: JsonnableEd25519KeyIdentity) => config.set('token', token);
export const getToken = (): JsonnableEd25519KeyIdentity | undefined => {
  const use = getUse();

  if (!isDefaultProfile(use)) {
    return getProfiles()?.[use!]?.token;
  }

  return config.get('token');
};

const saveAuthSatellites = (satellites: AuthSatelliteConfig[]) =>
  config.set('satellites', satellites);
export const getAuthSatellites = (): AuthSatelliteConfig[] => {
  const use = getUse();

  if (!isDefaultProfile(use)) {
    return getProfiles()?.[use!]?.satellites ?? [];
  }

  return config.get('satellites');
};

const saveAuthMissionControl = (missionControl: string) =>
  config.set('missionControl', missionControl);
export const getAuthMissionControl = (): string | undefined => {
  const use = getUse();

  if (!isDefaultProfile(use)) {
    return getProfiles()?.[use!]?.missionControl;
  }

  return config.get('missionControl');
};

const saveAuthOrbiters = (orbiters: AuthOrbiterConfig[]) => config.set('orbiters', orbiters);
export const getAuthOrbiters = (): AuthOrbiterConfig[] | undefined => {
  const use = getUse();

  if (!isDefaultProfile(use)) {
    return getProfiles()?.[use!]?.orbiters;
  }

  return config.get('orbiters');
};

export const clearAuthConfig = () => config.clear();
