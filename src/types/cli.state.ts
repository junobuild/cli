import {type PrincipalText} from '@dfinity/zod-schemas';

export type ConfigHash = string;
export type RuleHash = ConfigHash;
export type SettingsHash = ConfigHash;

export type CliStateSatelliteAppliedCollection = string;

export interface CliStateSatelliteAppliedCollectionsHashes {
  storage: Record<CliStateSatelliteAppliedCollection, RuleHash> | undefined;
  datastore: Record<CliStateSatelliteAppliedCollection, RuleHash> | undefined;
}

export interface CliStateSatelliteAppliedConfigHashes {
  storage: ConfigHash | undefined;
  datastore: ConfigHash | undefined;
  auth: ConfigHash | undefined;
  settings: SettingsHash | undefined;
  collections: CliStateSatelliteAppliedCollectionsHashes | undefined;
}

export interface CliStateSatellite {
  lastAppliedConfig: CliStateSatelliteAppliedConfigHashes;
}

export type CliStateSatellites = Record<PrincipalText, CliStateSatellite>;

export interface CliState {
  satellites?: CliStateSatellites;
}
