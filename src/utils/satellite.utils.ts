import {SatelliteParameters} from '@junobuild/admin';
import {actorParameters} from './actor.utils';
import {getAuthSatellites} from './auth.config.utils';

export const satelliteParameters = (satelliteId: string): SatelliteParameters => {
  const satellites = getAuthSatellites();

  if (!satellites.map(({p}) => p).includes(satelliteId)) {
    throw new Error(
      'You are not a controller of the satellite. Are you logged in with the expected profile? Are you in the root directory of your project?'
    );
  }

  return {
    satelliteId,
    ...actorParameters()
  };
};

/**
 * For display purpose, use either the name or id. Most probably we should find a name but for simplicity reason we fallback to Id.
 * @param satellite name or id
 */
export const satelliteKey = (satelliteId: string): string => {
  const satellites = getAuthSatellites();
  const satellite = satellites.find(({p}) => p === satelliteId);
  return satellite?.n ?? satelliteId;
};
