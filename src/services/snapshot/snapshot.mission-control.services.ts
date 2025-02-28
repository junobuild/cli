import {isNullish} from '@dfinity/utils';
import {red} from 'kleur';
import {getCliMissionControl} from '../../configs/cli.config';
import type {AssetKey} from '../../types/asset-key';
import {createSnapshot, deleteSnapshot, restoreSnapshot} from './snapshot.services';

export const createSnapshotMissionControl = async () => {
  await executeSnapshotFn({
    fn: createSnapshot
  });
};

export const restoreSnapshotMissionControl = async () => {
  await executeSnapshotFn({
    fn: restoreSnapshot
  });
};

export const deleteSnapshotMissionControl = async () => {
  await executeSnapshotFn({
    fn: deleteSnapshot
  });
};

const executeSnapshotFn = async ({
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
