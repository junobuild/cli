import {getCliOrbiters} from '../../configs/cli.config';
import type {AssetKey} from '../../types/asset-key';
import {createSnapshot, restoreSnapshot} from './backup.services';

export const createSnapshotOrbiter = async () => {
  await executeBackupFn({
    fn: createSnapshot
  });
};

export const restoreSnapshotOrbiter = async () => {
  await executeBackupFn({
    fn: restoreSnapshot
  });
};

const executeBackupFn = async ({
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
