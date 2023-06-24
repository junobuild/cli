import {CONSOLE_SATELLITE_URL} from '../constants/constants';

export const defaultSatelliteDomain = (satelliteId: string): string =>
  `https://${satelliteId}.icp0.io`;

export const consoleUrl = (satelliteId: string): string => `${CONSOLE_SATELLITE_URL}${satelliteId}`;
