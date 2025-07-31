import type {JsonnableEd25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';

export interface CliConfig {
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
