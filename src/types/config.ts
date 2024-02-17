import type {JunoConfig, JunoConfigEnv, SatelliteConfig} from '@junobuild/config';

export type ConfigType = 'ts' | 'js' | 'json';

export interface SatelliteConfigEnv {
  satellite: SatelliteConfig;
  env: JunoConfigEnv;
}

export type JunoConfigWithSatelliteId = Omit<JunoConfig, 'satellite'> & {
  satellite: Omit<SatelliteConfig, 'satelliteId' | 'satellitesIds'> &
    Required<Pick<SatelliteConfig, 'satelliteId'>>;
};
