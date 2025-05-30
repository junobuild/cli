import {type SatelliteParameters} from '@junobuild/admin';

export type SatelliteParametersWithId = Omit<SatelliteParameters, 'satelliteId'> &
  Required<Pick<SatelliteParameters, 'satelliteId'>>;
