import {nonNullish} from '@dfinity/utils';
import {CONSOLE_SATELLITE_URL} from '../constants/constants';

export const defaultSatelliteDomain = (satelliteId: string): string => {
  if (nonNullish(process.env.CONTAINER_URL)) {
    return `http://${satelliteId}.${process.env.CONTAINER_URL.replace('http://127.0.0.1', 'localhost')}`;
  }

  return `https://${satelliteId}.icp0.io`;
};

export const consoleUrl = (satelliteId: string): string => `${CONSOLE_SATELLITE_URL}${satelliteId}`;
