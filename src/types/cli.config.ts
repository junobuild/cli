import type {JsonnableEd25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';

export interface CliConfigData {
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
export interface CliConfig extends CliConfigData {
  use?: CliProfile;
  profiles?: Record<string, CliConfigData>;
}
