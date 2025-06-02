import {type SatelliteParametersWithId} from './satellite';

export interface UpgradeFunctionsParams {
  src: string;
  satellite: SatelliteParametersWithId;
  args?: string[];
}
