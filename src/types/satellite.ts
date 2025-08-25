import type {PrincipalText} from '@dfinity/zod-schemas';
import type {SatelliteParameters} from '@junobuild/ic-client/actor';

export type SatelliteParametersWithId = Omit<SatelliteParameters, 'satelliteId'> & {
  satelliteId: PrincipalText;
};
