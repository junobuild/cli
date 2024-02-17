import {type SatelliteParameters} from '@junobuild/admin';
import {assertNonNullish} from '@junobuild/utils';
import {getCliOrbiters, getCliSatellites} from '../configs/cli.config';
import type {SatelliteConfigEnv} from '../types/config';
import {actorParameters} from './actor.utils';

export const satelliteParameters = ({
  satellite: {satelliteId: satelliteIdUser, satellitesIds},
  env: {mode}
}: SatelliteConfigEnv): Omit<SatelliteParameters, 'satelliteId'> &
  Required<Pick<SatelliteParameters, 'satelliteId'>> => {
  const satelliteId = satellitesIds?.[mode] ?? satelliteIdUser;

  assertNonNullish(
    satelliteId,
    `A satellite ID must be provided in your configuration. Selected mode: ${mode}`
  );

  return {
    satelliteId,
    ...actorParameters()
  };
};

/**
 * For display purpose, use either the name or id. Most probably we should find a name but for simplicity reason we fallback to Id.
 * @param satelliteId name or id
 */
export const satelliteKey = (satelliteId: string): string => {
  const satellites = getCliSatellites();
  const satellite = satellites.find(({p}) => p === satelliteId);
  return satellite?.n ?? satelliteId;
};

export const orbiterKey = (orbiterId: string): string => {
  const orbiters = getCliOrbiters();
  const orbiter = orbiters?.find(({p}) => p === orbiterId);
  return orbiter?.n !== undefined && orbiter?.n !== '' ? orbiter.n : orbiterId;
};
