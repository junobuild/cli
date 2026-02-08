import {isNullish} from '@dfinity/utils';
import type {AssetKey} from '../../../types/asset-key';
import {assertConfigAndLoadOrbiterContext} from '../../../utils/juno.config.utils';
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
  const orbiter = await assertConfigAndLoadOrbiterContext();

  if (isNullish(orbiter)) {
    return;
  }

  const {
    orbiter: {orbiterId}
  } = orbiter;

  await fn({
    canisterId: orbiterId,
    segment: 'orbiter'
  });
};
