import {isNullish} from '@dfinity/utils';
import type {AssetKey} from '../../../types/asset-key';
import {assertConfigAndReadOrbiterId} from '../../../utils/juno.config.utils';
import {
  createSnapshot,
  deleteSnapshot,
  downloadSnapshot,
  listSnapshot,
  restoreSnapshot,
  uploadSnapshot
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

export const listSnapshotOrbiter = async () => {
  await executeSnapshotFn({
    fn: listSnapshot
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

export const uploadSnapshotOrbiter = async (args?: string[]) => {
  await executeSnapshotFn({
    fn: async (params) => {
      await uploadSnapshot({...params, args});
    }
  });
};

const executeSnapshotFn = async ({
  fn
}: {
  fn: (params: {canisterId: string; segment: AssetKey}) => Promise<void>;
}) => {
  const {orbiterId} = await assertConfigAndReadOrbiterId();

  if (isNullish(orbiterId)) {
    return;
  }

  await fn({
    canisterId: orbiterId,
    segment: 'orbiter'
  });
};
