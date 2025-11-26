import {isNullish} from '@dfinity/utils';
import {Principal} from '@icp-sdk/core/principal';
import {cyan, red} from 'kleur';
import ora from 'ora';
import {canisterStart, canisterStop} from '../../api/ic.api';
import {getCliMissionControl, getCliOrbiters} from '../../configs/cli.config';
import type {AssetKey} from '../../types/asset-key';
import type {StartStopAction} from '../../types/start-stop';
import {assertConfigAndLoadSatelliteContext} from '../../utils/juno.config.utils';

export const startStopMissionControl = async ({
  action
}: {
  args?: string[];
  action: StartStopAction;
}) => {
  const missionControl = await getCliMissionControl();

  if (isNullish(missionControl)) {
    console.log(red(`A mission control must be set in your configuration.`));
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
    console.log(red(`The CLI supports only one orbiter per project. Reach out to Juno.`));
    process.exit(1);
  }

  const [orbiter] = authOrbiters;

  await startStop({
    action,
    segment: 'orbiter',
    canisterId: orbiter.p
  });
};

export const startStopSatellite = async ({action}: {action: StartStopAction}) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext();
  const {satelliteId} = satellite;

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
