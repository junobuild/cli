import {nonNullish} from '@dfinity/utils';
import {DEV, ENV} from '../env';

export const defaultSatelliteDomain = (satelliteId: string): string => {
  if (DEV && nonNullish(ENV.containerUrl)) {
    const url = URL.parse(ENV.containerUrl);
    return `${url?.protocol ?? 'http:'}//${satelliteId}.${(url?.host ?? '127.0.0.1:5987').replace('127.0.0.1', 'localhost')}`;
  }

  return `https://${satelliteId}.icp0.io`;
};

export const consoleUrl = (satelliteId: string): string =>
  `${ENV.consoleSatelliteUrl}${satelliteId}`;
