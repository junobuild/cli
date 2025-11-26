import type {PrincipalText} from '@dfinity/zod-schemas';
import type {OrbiterParameters, SatelliteParameters} from '@junobuild/ic-client/actor';

export type SatelliteParametersWithId = Omit<SatelliteParameters, 'satelliteId'> & {
  satelliteId: PrincipalText;
};

export type OrbiterParametersWithId = Omit<OrbiterParameters, 'orbiterId'> & {
  orbiterId: PrincipalText;
};
