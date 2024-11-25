import {Principal} from '@dfinity/principal';
import {assertNonNullish, isNullish} from '@junobuild/utils';
import {cyan, red} from 'kleur';
import ora from 'ora';
import {canisterStart, canisterStop} from '../api/ic.api';
import {getCliMissionControl, getCliOrbiters} from '../configs/cli.config';
import {junoConfigExist, readJunoConfig} from '../configs/juno.config';
import type {AssetKey} from '../types/asset-key';
import type {StartStopAction} from '../types/start-stop';
import {configEnv} from '../utils/config.utils';
import {consoleNoConfigFound} from '../utils/msg.utils';
import {satelliteParameters} from '../utils/satellite.utils';

export const startStopMissionControl = async ({
  action
}: {
  args?: string[];
  action: StartStopAction;
}) => {
  const missionControl = await getCliMissionControl();

  if (isNullish(missionControl)) {
    console.log(`${red(`A mission control must be set in your configuration.`)}`);
    process.exit(1);
  }

  await startStop({
    action,
    segment: 'mission_control',
    canisterId: missionControl
  });
};

export const startStopOrbiter = async ({action}: {args?: string[]; action: StartStopAction}) => {
  const authOrbiters = await getCliOrbiters();

  if (authOrbiters === undefined || authOrbiters.length === 0) {
    return;
  }

  if (authOrbiters.length > 0) {
    console.log(`${red(`The CLI supports only one orbiter per project. Reach out to Juno.`)}`);
    process.exit(1);
  }

  const [orbiter] = authOrbiters;

  await startStop({
    action,
    segment: 'orbiter',
    canisterId: orbiter.p
  });
};

export const startStopSatellite = async ({
  args,
  action
}: {
  args?: string[];
  action: StartStopAction;
}) => {
  if (!(await junoConfigExist())) {
    consoleNoConfigFound();
    return;
  }

  const env = configEnv(args);
  const {satellite: satelliteConfig} = await readJunoConfig(env);

  const satellite = await satelliteParameters({satellite: satelliteConfig, env});
  const {satelliteId} = satellite;

  // TS guard. satelliteParameters exit if satelliteId is undefined.
  assertNonNullish(satelliteId);

  await startStop({
    action,
    segment: 'satellite',
    canisterId: satelliteId
  });
};

const startStop = async ({
  action,
  segment,
  canisterId
}: {
  action: StartStopAction;
  canisterId: string;
  segment: AssetKey;
}) => {
  const spinner = ora(`${action === 'stop' ? 'Stopping' : 'Starting'} satellite...`).start();

  try {
    const fn = action === 'stop' ? canisterStop : canisterStart;
    await fn({canisterId: Principal.fromText(canisterId)});
  } finally {
    spinner.stop();
  }

  const capitalize = (str: string): string => str[0].toUpperCase() + str.slice(1);

  console.log(
    `${capitalize(segment)} ${canisterId} ${cyan(action === 'stop' ? 'stopped' : 'started')}.`
  );
};
