import type {JsonnableEd25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';
import Conf, {Schema} from 'conf';

interface AuthConfig {
  token: JsonnableEd25519KeyIdentity;
  satellites: AuthSatelliteConfig[];
  missionControl?: string;
}

export interface AuthSatelliteConfig {
  p: string; // principal
  n: string; // name
}

const schema: Schema<AuthConfig> = {
  token: {
    type: 'array'
  },
  satellites: {
    type: 'array'
  }
} as const;

const config = new Conf<AuthConfig>({projectName: 'juno', schema});

// Save in https://github.com/sindresorhus/env-paths#pathsconfig
export const saveToken = (token: JsonnableEd25519KeyIdentity) => config.set('token', token);
export const getToken = (): JsonnableEd25519KeyIdentity => config.get('token');

export const saveAuthSatellites = (satellites: AuthSatelliteConfig[]) =>
  config.set('satellites', satellites);
export const getAuthSatellites = (): AuthSatelliteConfig[] => config.get('satellites');

export const saveMissionControl = (missionControl: string | undefined) =>
  config.set('missionControl', missionControl);
export const getMissionControl = (): string | undefined => config.get('missionControl');

export const clearAuthConfig = () => config.clear();
