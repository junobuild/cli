import type {JunoConfigEnv, SatelliteConfig} from '@junobuild/config';

export type ConfigType = 'ts' | 'js' | 'json';

export interface SatelliteConfigEnv {
  satellite: SatelliteConfig;
  env: JunoConfigEnv;
}
