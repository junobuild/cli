import {type SatelliteParameters} from '@junobuild/admin';
import {isNullish} from '@junobuild/utils';
import {red} from 'kleur';
import {actorParameters} from '../api/actor.api';
import {getCliOrbiters, getCliSatellites} from '../configs/cli.config';
import type {SatelliteConfigEnv} from '../types/config';

export const satelliteParameters = async ({
  satellite: {satelliteId: deprecatedSatelliteId, id, ids},
  env: {mode}
}: SatelliteConfigEnv): Promise<
  Omit<SatelliteParameters, 'satelliteId'> & Required<Pick<SatelliteParameters, 'satelliteId'>>
> => {
  const satelliteId = ids?.[mode] ?? id ?? deprecatedSatelliteId;

  if (isNullish(satelliteId)) {
    console.log(`${red(`A satellite ID for ${mode} must be set in your configuration.`)}`);
    process.exit(1);
  }

  return {
    satelliteId,
    ...(await actorParameters())
  };
};

/**
 * For display purpose, use either the name or id. Most probably we should find a name but for simplicity reason we fallback to Id.
 * @param satelliteId name or id
 */
export const satelliteKey = async (satelliteId: string): Promise<string> => {
  const satellites = await getCliSatellites();
  const satellite = satellites.find(({p}) => p === satelliteId);
  return satellite?.n ?? satelliteId;
};

export const orbiterKey = async (orbiterId: string): Promise<string> => {
  const orbiters = await getCliOrbiters();
  const orbiter = orbiters?.find(({p}) => p === orbiterId);
  return orbiter?.n !== undefined && orbiter?.n !== '' ? orbiter.n : orbiterId;
};
