import {assertNonNullish, isNullish} from '@dfinity/utils';
import type {PrincipalText} from '@dfinity/zod-schemas';
import type {JunoConfig, JunoConfigEnv, OrbiterConfig, SatelliteConfig} from '@junobuild/config';
import {red} from 'kleur';
import {actorParameters} from '../api/actor.api';
import {noJunoConfig, readJunoConfig} from '../configs/juno.config';
import {ENV} from '../env';
import type {OrbiterParametersWithId, SatelliteParametersWithId} from '../types/satellite';
import {consoleNoConfigFound} from './msg.utils';

interface SatelliteConfigEnv {
  satellite: SatelliteConfig;
  env: JunoConfigEnv;
}

interface OrbiterConfigEnv {
  orbiter: OrbiterConfig | undefined;
  env: JunoConfigEnv;
}

export const assertConfigAndLoadSatelliteContext = async (): Promise<{
  satellite: SatelliteParametersWithId;
  satelliteConfig: SatelliteConfig;
}> => {
  const {satellite: satelliteConfig} = await assertAndReadJunoConfig();

  const satellite = await satelliteParameters({satellite: satelliteConfig, env: ENV});

  // TS guard. satelliteParameters exit if satelliteId is undefined.
  // Should not happen.
  assertNonNullish(satellite.satelliteId);

  return {satellite, satelliteConfig};
};

export const assertConfigAndLoadOrbiterContext = async (): Promise<
  | {
      orbiter: OrbiterParametersWithId;
      orbiterConfig: OrbiterConfig;
    }
  | undefined
> => {
  const {orbiter: orbiterConfig} = await assertAndReadJunoConfig();

  if (isNullish(orbiterConfig)) {
    return undefined;
  }

  const {orbiterId} = readOrbiterId({orbiter: orbiterConfig, env: ENV});

  // Unlikely
  if (isNullish(orbiterId)) {
    return undefined;
  }

  return {
    orbiter: {
      orbiterId,
      ...(await actorParameters())
    },
    orbiterConfig
  };
};

// Useful for reading the configuration without initializing an actor.
// For example, during the authentication flow when no identity is defined yet,
// or in other cases where we want to avoid waiting for the actor initialization timeout.
export const assertConfigAndReadSatelliteId = async (): Promise<{satelliteId: PrincipalText}> => {
  const {satellite: satelliteConfig} = await assertAndReadJunoConfig();

  return assertAndReadSatelliteId({satellite: satelliteConfig, env: ENV});
};

const assertAndReadJunoConfig = async (): Promise<JunoConfig> => {
  if (await noJunoConfig()) {
    consoleNoConfigFound();
    process.exit(1);
  }

  return await readJunoConfig(ENV);
};

const assertAndReadSatelliteId = ({
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

  // TODO: Principal.isPrincipal

  if (isNullish(satelliteId)) {
    console.log(red(`A satellite ID for ${mode} must be set in your configuration.`));
    process.exit(1);
  }

  return {satelliteId};
};

const readOrbiterId = ({
  orbiter,
  env: {mode}
}: OrbiterConfigEnv): {orbiterId: PrincipalText | undefined} => {
  const {id, ids} = orbiter ?? {};

  const orbiterId = ids?.[mode] ?? id;

  // TODO: Principal.isPrincipal
  // If e.g. <DEVELOPMENT_ID> then undefined

  return {orbiterId};
};

const satelliteParameters = async (
  params: SatelliteConfigEnv
): Promise<SatelliteParametersWithId> => {
  const {satelliteId} = assertAndReadSatelliteId(params);

  return {
    satelliteId,
    ...(await actorParameters())
  };
};
