import {assertNonNullish, isNullish} from '@dfinity/utils';
import {type JunoConfigEnv, type SatelliteConfig} from '@junobuild/config';
import {red} from 'kleur';
import {actorParameters} from '../api/actor.api';
import {getCliOrbiters, getCliSatellites} from '../configs/cli.config';
import {junoConfigExist, readJunoConfig} from '../configs/juno.config';
import type {SatelliteConfigEnv} from '../types/config';
import type {SatelliteParametersWithId} from '../types/satellite';
import {configEnv} from './config.utils';
import {consoleNoConfigFound} from './msg.utils';

export const assertConfigAndLoadSatelliteContext = async (
  args?: string[]
): Promise<{
  satellite: SatelliteParametersWithId;
  satelliteConfig: SatelliteConfig;
  env: JunoConfigEnv;
}> => {
  if (!(await junoConfigExist())) {
    consoleNoConfigFound();
    process.exit(1);
  }

  const env = configEnv(args);
  const {satellite: satelliteConfig} = await readJunoConfig(env);

  const satellite = await satelliteParameters({satellite: satelliteConfig, env});

  // TS guard. satelliteParameters exit if satelliteId is undefined.
  // Should not happen.
  assertNonNullish(satellite.satelliteId);

  return {satellite, satelliteConfig, env};
};

const satelliteParameters = async ({
  satellite: {satelliteId: deprecatedSatelliteId, id, ids},
  env: {mode}
}: SatelliteConfigEnv): Promise<SatelliteParametersWithId> => {
  const satelliteId = ids?.[mode] ?? id ?? deprecatedSatelliteId;

  if (isNullish(satelliteId)) {
    console.log(red(`A satellite ID for ${mode} must be set in your configuration.`));
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
  return orbiter?.n !== undefined && orbiter.n !== '' ? orbiter.n : orbiterId;
};
