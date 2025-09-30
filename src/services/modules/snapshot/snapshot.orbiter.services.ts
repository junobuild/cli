import {getCliOrbiters} from '../../../configs/cli.config';
import type {AssetKey} from '../../../types/asset-key';
import {
  createSnapshot,
  deleteSnapshot,
  downloadSnapshot,
  restoreSnapshot
} from './snapshot.services';

export const createSnapshotOrbiter = async () => {
  await executeSnapshotFn({
    fn: createSnapshot
  });
};

export const restoreSnapshotOrbiter = async () => {
  await executeSnapshotFn({
    fn: restoreSnapshot
  });
};

export const deleteSnapshotOrbiter = async () => {
  await executeSnapshotFn({
    fn: deleteSnapshot
  });
};

export const downloadSnapshotOrbiter = async () => {
  await executeSnapshotFn({
    fn: downloadSnapshot
  });
};

const executeSnapshotFn = async ({
  fn
}: {
  fn: (params: {canisterId: string; segment: AssetKey}) => Promise<void>;
}) => {
  const authOrbiters = await getCliOrbiters();

  if (authOrbiters === undefined || authOrbiters.length === 0) {
    return;
  }

  for (const orbiter of authOrbiters) {
    await fn({
      canisterId: orbiter.p,
      segment: 'orbiter'
    });
  }
};
