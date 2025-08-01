import {assertNonNullish, isNullish} from '@dfinity/utils';
import type {PrincipalText} from '@dfinity/zod-schemas';
import type {SatelliteConfig} from '@junobuild/config';
import {red} from 'kleur';
import {actorParameters} from '../api/actor.api';
import {getCliOrbiters, getCliSatellites} from '../configs/cli.config';
import {junoConfigExist, readJunoConfig} from '../configs/juno.config';
import {ENV} from '../env';
import type {SatelliteConfigEnv} from '../types/config';
import type {SatelliteParametersWithId} from '../types/satellite';
import {consoleNoConfigFound} from './msg.utils';

export const assertConfigAndLoadSatelliteContext = async (): Promise<{
  satellite: SatelliteParametersWithId;
  satelliteConfig: SatelliteConfig;
}> => {
  if (!(await junoConfigExist())) {
    consoleNoConfigFound();
    process.exit(1);
  }

  const {satellite: satelliteConfig} = await readJunoConfig(ENV);

  const satellite = await satelliteParameters({satellite: satelliteConfig, env: ENV});

  // TS guard. satelliteParameters exit if satelliteId is undefined.
  // Should not happen.
  assertNonNullish(satellite.satelliteId);

  return {satellite, satelliteConfig};
};

export const assertConfigAndReadSatelliteId = ({
  satellite,
  env: {mode}
}: SatelliteConfigEnv): {satelliteId: PrincipalText} => {
  const {id, ids} = satellite;

  // Originally, the config used `satelliteId`, but we later migrated to `id` and `ids`.
  // We kept `satelliteId` in the configuration types for a while, but it is now deprecated there as well.
  // For backwards compatibility, we still read it here.
  const deprecatedSatelliteId =
    'satelliteId' in satellite
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        (satellite as unknown as {satelliteId: PrincipalText}).satelliteId
      : undefined;

  const satelliteId = ids?.[mode] ?? id ?? deprecatedSatelliteId;

  if (isNullish(satelliteId)) {
    console.log(red(`A satellite ID for ${mode} must be set in your configuration.`));
    process.exit(1);
  }

  return {satelliteId};
};

const satelliteParameters = async (
  params: SatelliteConfigEnv
): Promise<SatelliteParametersWithId> => {
  const {satelliteId} = assertConfigAndReadSatelliteId(params);

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
  return orbiter?.n !== undefined && orbiter.n !== '' ? orbiter.n : orbiterId;
};
