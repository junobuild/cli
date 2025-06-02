import type {snapshot_id} from '@dfinity/ic-management';
import {encodeSnapshotId} from '@dfinity/ic-management';
import {Principal} from '@dfinity/principal';
import {isNullish, nonNullish} from '@dfinity/utils';
import {red} from 'kleur';
import ora from 'ora';
import {
  deleteCanisterSnapshot,
  listCanisterSnapshots,
  loadCanisterSnapshot,
  takeCanisterSnapshot
} from '../../../api/ic.api';
import type {AssetKey} from '../../../types/asset-key';
import {displaySegment} from '../../../utils/display.utils';
import {confirmAndExit} from '../../../utils/prompt.utils';

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
      `A snapshot for your ${displaySegment(segment)} already exists with ID 0x${encodeSnapshotId(existingSnapshotId)}. Do you want to overwrite it?`
    );
  }

  await takeSnapshot({
    canisterId,
    snapshotId: existingSnapshotId,
    segment
  });
};

export const restoreSnapshot = async ({
  canisterId: cId,
  segment
}: {
  canisterId: string;
  segment: AssetKey;
}) => {
  const canisterId = Principal.fromText(cId);

  const existingSnapshotId = await loadSnapshot({canisterId});

  if (isNullish(existingSnapshotId)) {
    console.log(red(`No snapshot found for your ${displaySegment(segment)}.`));
    return;
  }

  await confirmAndExit(
    `Restoring the snapshot 0x${encodeSnapshotId(existingSnapshotId)} will permanently overwrite the current state of your ${displaySegment(segment)}. Are you sure you want to proceed?`
  );

  await restoreExistingSnapshot({
    canisterId,
    snapshotId: existingSnapshotId,
    segment
  });
};

export const deleteSnapshot = async ({
  canisterId: cId,
  segment
}: {
  canisterId: string;
  segment: AssetKey;
}) => {
  const canisterId = Principal.fromText(cId);

  const existingSnapshotId = await loadSnapshot({canisterId});

  if (isNullish(existingSnapshotId)) {
    console.log(red(`No snapshot found for your ${displaySegment(segment)}.`));
    return;
  }

  await confirmAndExit(
    `Are you sure you want to delete the snapshot 0x${encodeSnapshotId(existingSnapshotId)} of your ${displaySegment(segment)}?`
  );

  await deleteExistingSnapshot({
    canisterId,
    snapshotId: existingSnapshotId,
    segment
  });
};

const restoreExistingSnapshot = async ({
  segment,
  ...rest
}: {
  canisterId: Principal;
  snapshotId: snapshot_id;
  segment: AssetKey;
}): Promise<void> => {
  const spinner = ora('Restoring the snapshot...').start();

  try {
    await loadCanisterSnapshot(rest);
  } finally {
    spinner.stop();
  }

  console.log(`✅ The snapshot for your ${displaySegment(segment)} was restored.`);
};

const deleteExistingSnapshot = async ({
  segment,
  ...rest
}: {
  canisterId: Principal;
  snapshotId: snapshot_id;
  segment: AssetKey;
}): Promise<void> => {
  const spinner = ora('Deleting the snapshot...').start();

  try {
    await deleteCanisterSnapshot(rest);
  } finally {
    spinner.stop();
  }

  console.log(`✅ The snapshot for your ${displaySegment(segment)} was deleted.`);
};

const takeSnapshot = async ({
  segment,
  ...rest
}: {
  canisterId: Principal;
  snapshotId: snapshot_id | undefined;
  segment: AssetKey;
}): Promise<void> => {
  const spinner = ora('Creating a new snapshot...').start();

  try {
    await takeCanisterSnapshot(rest);
  } finally {
    spinner.stop();
  }

  console.log(`✅ The snapshot for your ${displaySegment(segment)} was created.`);
};

const loadSnapshot = async ({
  canisterId
}: {
  canisterId: Principal;
}): Promise<snapshot_id | undefined> => {
  const spinner = ora('Loading the existing snapshot...').start();

  try {
    const snapshots = await listCanisterSnapshots({
      canisterId
    });

    return snapshots[0]?.id;
  } finally {
    spinner.stop();
  }
};
