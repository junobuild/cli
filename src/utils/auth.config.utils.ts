import type {JsonnableEd25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';
import Conf, {Schema} from 'conf';
import {AUTH_PROJECT_NAME} from '../constants/constants';

interface AuthConfigData {
  token: JsonnableEd25519KeyIdentity;
  satellites: AuthSatelliteConfig[];
  missionControl?: string;
}

export interface AuthSatelliteConfig {
  p: string; // principal
  n: string; // name
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
  missionControl,
  profile
}: {
  token: JsonnableEd25519KeyIdentity;
  satellites: AuthSatelliteConfig[];
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
        ...(missionControl !== null && {missionControl})
      }
    });

    saveUse(profile!);

    return;
  }

  saveToken(token);
  saveAuthSatellites(satellites);

  if (missionControl !== null) {
    saveMissionControl(missionControl);
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

const saveMissionControl = (missionControl: string) => config.set('missionControl', missionControl);
export const getMissionControl = (): string | undefined => {
  const use = getUse();

  if (!isDefaultProfile(use)) {
    return getProfiles()?.[use!]?.missionControl;
  }

  return config.get('missionControl');
};

export const clearAuthConfig = () => config.clear();
