import type {OrbiterParameters, SatelliteParameters} from '@junobuild/ic-client/actor';
import type {PrincipalText} from '@junobuild/schema';

export type SatelliteParametersWithId = Omit<SatelliteParameters, 'satelliteId'> & {
  satelliteId: PrincipalText;
};

export type OrbiterParametersWithId = Omit<OrbiterParameters, 'orbiterId'> & {
  orbiterId: PrincipalText;
};
