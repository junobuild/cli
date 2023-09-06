import {SatelliteParameters} from '@junobuild/admin';
import {getAuthOrbiters, getAuthSatellites} from '../configs/auth.config';
import {actorParameters} from './actor.utils';

export const satelliteParameters = (satelliteId: string): SatelliteParameters => ({
  satelliteId,
  ...actorParameters()
});

/**
 * For display purpose, use either the name or id. Most probably we should find a name but for simplicity reason we fallback to Id.
 * @param satelliteId name or id
 */
export const satelliteKey = (satelliteId: string): string => {
  const satellites = getAuthSatellites();
  const satellite = satellites.find(({p}) => p === satelliteId);
  return satellite?.n ?? satelliteId;
};

export const orbiterKey = (orbiterId: string): string => {
  const orbiters = getAuthOrbiters();
  const orbiter = orbiters?.find(({p}) => p === orbiterId);
  return orbiter?.n !== undefined && orbiter?.n !== '' ? orbiter.n : orbiterId;
};
