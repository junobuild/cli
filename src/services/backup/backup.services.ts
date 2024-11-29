import type {snapshot_id} from '@dfinity/ic-management';
import {encodeSnapshotId} from '@dfinity/ic-management';
import {Principal} from '@dfinity/principal';
import {nonNullish} from '@junobuild/utils';
import ora from 'ora';
import {listCanisterSnapshots, takeCanisterSnapshot} from '../../api/ic.api';
import type {AssetKey} from '../../types/asset-key';
import {confirmAndExit} from '../../utils/prompt.utils';

export const createSnapshot = async ({
  canisterId: cId,
  segment
}: {
  canisterId: string;
  segment: AssetKey;
}) => {
  const canisterId = Principal.fromText(cId);

  const existingSnapshotId = await loadSnapshot({canisterId});

  if (nonNullish(existingSnapshotId)) {
    await confirmAndExit(
      `A backup for your ${segment} already exists with ID ${encodeSnapshotId(existingSnapshotId)}. Do you want to overwrite it?`
    );
  }

  await takeSnapshot({
    canisterId,
    snapshotId: existingSnapshotId,
    segment
  });
};

const takeSnapshot = async ({
  segment,
  ...rest
}: {
  canisterId: Principal;
  snapshotId: snapshot_id | undefined;
  segment: AssetKey;
}): Promise<void> => {
  const spinner = ora('Creating a new backup...').start();

  try {
    await takeCanisterSnapshot(rest);
  } finally {
    spinner.stop();
  }

  console.log(`The backup for your ${segment} has been successfully created.`);
};

const loadSnapshot = async ({
  canisterId
}: {
  canisterId: Principal;
}): Promise<snapshot_id | undefined> => {
  const spinner = ora('Loading the existing backup...').start();

  try {
    const snapshots = await listCanisterSnapshots({
      canisterId
    });

    return snapshots?.[0]?.id;
  } finally {
    spinner.stop();
  }
};
