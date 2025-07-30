import {type PrincipalText} from '@dfinity/zod-schemas';

export type ConfigHash = string;
export type SettingsHash = ConfigHash;

export interface CliStateSatelliteAppliedConfigHashes {
  storage: ConfigHash | undefined;
  datastore: ConfigHash | undefined;
  auth: ConfigHash | undefined;
  settings: SettingsHash | undefined;
}

export interface CliStateSatellite {
  lastAppliedConfig: CliStateSatelliteAppliedConfigHashes;
}

export type CliStateSatellites = Record<PrincipalText, CliStateSatellite>;

export interface CliState {
  satellites: CliStateSatellites;
}
