import type {JunoConfig, JunoConfigEnv, OrbiterConfig, SatelliteConfig} from '@junobuild/config';

export interface SatelliteConfigEnv {
  satellite: SatelliteConfig;
  env: JunoConfigEnv;
}

export type JunoConfigWithSatelliteId = Omit<JunoConfig, 'satellite' | 'orbiter'> & {
  satellite: Omit<SatelliteConfig, 'id' | 'satellitesIds'> & Required<Pick<SatelliteConfig, 'id'>>;
  orbiter?: Omit<OrbiterConfig, 'orbiterId'>;
};
