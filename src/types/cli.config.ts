import type {JsonnableEd25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';
import type {PrincipalText} from '@dfinity/zod-schemas';

export interface CliConfig {
  token: JsonnableEd25519KeyIdentity;
  satellites: CliSatelliteConfig[];
  missionControl?: string;
  orbiters?: CliOrbiterConfig[];
}

export interface CliSatelliteConfig {
  p: PrincipalText; // principal
  n: string; // name
}

export interface CliOrbiterConfig {
  p: PrincipalText; // principal
  n?: string; // name
}
