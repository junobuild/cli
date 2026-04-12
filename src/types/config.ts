import type {HostingConfig, JunoConfig, OrbiterConfig, SatelliteConfig} from '@junobuild/config';

export type JunoConfigWithSatelliteId = Omit<JunoConfig, 'satellite' | 'orbiter'> & {
  satellite: Omit<SatelliteConfig, 'id' | 'satellitesIds'> & Required<Pick<SatelliteConfig, 'id'>>;
  orbiter?: Omit<OrbiterConfig, 'orbiterId'>;
};

export type JunoConfigWithPlaceholder = Omit<JunoConfig, 'satellite' | 'orbiter'> & {
  satellite: {
    hosting: Pick<HostingConfig, 'source'>;
  };
};
