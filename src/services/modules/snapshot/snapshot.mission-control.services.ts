import {isNullish} from '@dfinity/utils';
import {red} from 'kleur';
import {getCliMissionControl} from '../../../configs/cli.config';
import type {AssetKey} from '../../../types/asset-key';
import {createSnapshot, deleteSnapshot, downloadSnapshot, restoreSnapshot} from './snapshot.services';

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

export const downloadSnapshotMissionControl = async () => {
  await executeSnapshotFn({
    fn: downloadSnapshot
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
      `${red('No mission control found.')} This is expected if your access key doesn't manage it.`
    );
    return;
  }

  await fn({
    canisterId: missionControl,
    segment: 'mission_control'
  });
};
