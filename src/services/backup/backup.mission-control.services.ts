import {isNullish} from '@junobuild/utils';
import {red} from 'kleur';
import {getCliMissionControl} from '../../configs/cli.config';
import type {AssetKey} from '../../types/asset-key';
import {createSnapshot, restoreSnapshot} from './backup.services';

export const createSnapshotMissionControl = async () => {
  await executeBackupFn({
    fn: createSnapshot
  });
};

export const restoreSnapshotMissionControl = async () => {
  await executeBackupFn({
    fn: restoreSnapshot
  });
};

const executeBackupFn = async ({
  fn
}: {
  fn: (params: {canisterId: string; segment: AssetKey}) => Promise<void>;
}) => {
  const missionControl = await getCliMissionControl();

  // TODO: this can be a common assertion
  if (isNullish(missionControl)) {
    console.log(
      `${red(
        'No mission control found.'
      )} Ignore this error if your controller does not control your mission control.`
    );
    return;
  }

  await fn({
    canisterId: missionControl,
    segment: 'mission_control'
  });
};
