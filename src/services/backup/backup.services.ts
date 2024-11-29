import type {snapshot_id} from '@dfinity/ic-management';
import {encodeSnapshotId} from '@dfinity/ic-management';
import {Principal} from '@dfinity/principal';
import {isNullish, nonNullish} from '@junobuild/utils';
import {red} from 'kleur';
import ora from 'ora';
import {
  deleteCanisterSnapshot,
  listCanisterSnapshots,
  loadCanisterSnapshot,
  takeCanisterSnapshot
} from '../../api/ic.api';
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
    console.log(`${red(`No backup found for your ${segment}.`)}`);
    return;
  }

  await confirmAndExit(
    `Restoring the backup ${encodeSnapshotId(existingSnapshotId)} will permanently overwrite the current state of your ${segment}. Are you sure you want to proceed?`
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
    console.log(`${red(`No backup found for your ${segment}.`)}`);
    return;
  }

  await confirmAndExit(
    `Deleting the backup ${encodeSnapshotId(existingSnapshotId)} of your ${segment}?`
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
  const spinner = ora('Restoring the backup...').start();

  try {
    await loadCanisterSnapshot(rest);
  } finally {
    spinner.stop();
  }

  console.log(`The backup for your ${segment} was restored.`);
};

const deleteExistingSnapshot = async ({
  segment,
  ...rest
}: {
  canisterId: Principal;
  snapshotId: snapshot_id;
  segment: AssetKey;
}): Promise<void> => {
  const spinner = ora('Deleting the backup...').start();

  try {
    await deleteCanisterSnapshot(rest);
  } finally {
    spinner.stop();
  }

  console.log(`The backup for your ${segment} was deleted.`);
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

  console.log(`The backup for your ${segment} was created.`);
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
