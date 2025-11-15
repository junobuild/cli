import {notEmptyString} from '@dfinity/utils';
import type {snapshot_id} from '@icp-sdk/canisters/ic-management';
import {encodeSnapshotId} from '@icp-sdk/canisters/ic-management';
import {Principal} from '@icp-sdk/core/principal';
import {nextArg} from '@junobuild/cli-tools';
import ora from 'ora';
import {
  deleteCanisterSnapshot,
  loadCanisterSnapshot,
  takeCanisterSnapshot
} from '../../../api/ic.api';
import type {AssetKey} from '../../../types/asset-key';
import {displaySegment} from '../../../utils/display.utils';
import {assertNonNullishFolderExists} from '../../../utils/fs.utils';
import {confirmAndExitUnlessHeadlessAndDev} from '../../../utils/prompt.utils';
import {assertMatchingJunoPackage} from './_snapshot.assert.services';
import {
  loadSnapshotAndAssertExist,
  loadSnapshotAndAssertOverwrite
} from './_snapshot.loader.services';
import {downloadExistingSnapshot} from './snapshot.download.services';
import {uploadExistingSnapshot} from './snapshot.upload.services';

export const createSnapshot = async ({
  canisterId: cId,
  segment
}: {
  canisterId: string;
  segment: AssetKey;
}) => {
  const canisterId = Principal.fromText(cId);

  const {snapshotId} = await loadSnapshotAndAssertOverwrite({canisterId, segment});

  await takeSnapshot({
    canisterId,
    snapshotId,
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

  const result = await loadSnapshotAndAssertExist({canisterId, segment});

  if (result.result === 'not_found') {
    return;
  }

  const {snapshotId: existingSnapshotId} = result;

  await confirmAndExitUnlessHeadlessAndDev(
    `Restoring the snapshot 0x${encodeSnapshotId(existingSnapshotId)} will permanently overwrite the current state of your ${displaySegment(segment)}. Are you sure you want to proceed?`
  );

  await restoreExistingSnapshot({
    canisterId,
    snapshotId: existingSnapshotId,
    segment
  });
};

export const listSnapshot = async ({
  canisterId: cId,
  segment
}: {
  canisterId: string;
  segment: AssetKey;
}) => {
  const canisterId = Principal.fromText(cId);

  const result = await loadSnapshotAndAssertExist({canisterId, segment});

  if (result.result === 'not_found') {
    return;
  }

  const {snapshotId: existingSnapshotId} = result;

  console.log(`🪣 Snapshot found: 0x${encodeSnapshotId(existingSnapshotId)}`);
};

export const deleteSnapshot = async ({
  canisterId: cId,
  segment
}: {
  canisterId: string;
  segment: AssetKey;
}) => {
  const canisterId = Principal.fromText(cId);

  const result = await loadSnapshotAndAssertExist({canisterId, segment});

  if (result.result === 'not_found') {
    return;
  }

  const {snapshotId: existingSnapshotId} = result;

  await confirmAndExitUnlessHeadlessAndDev(
    `Are you sure you want to delete the snapshot 0x${encodeSnapshotId(existingSnapshotId)} of your ${displaySegment(segment)}?`
  );

  await deleteExistingSnapshot({
    canisterId,
    snapshotId: existingSnapshotId,
    segment
  });
};

export const downloadSnapshot = async ({
  canisterId: cId,
  segment
}: {
  canisterId: string;
  segment: AssetKey;
}) => {
  const canisterId = Principal.fromText(cId);

  const result = await loadSnapshotAndAssertExist({canisterId, segment});

  if (result.result === 'not_found') {
    return;
  }

  const {snapshotId: existingSnapshotId} = result;

  await downloadExistingSnapshot({
    canisterId,
    snapshotId: existingSnapshotId,
    segment
  });
};

export const uploadSnapshot = async ({
  canisterId: cId,
  segment,
  args
}: {
  canisterId: string;
  segment: AssetKey;
  args?: string[];
}) => {
  const folder = nextArg({args, option: '--dir'});
  assertNonNullishFolderExists(folder);

  const targetCanisterId = nextArg({args, option: '--target-id'});

  if (notEmptyString(targetCanisterId)) {
    await assertMatchingJunoPackage({
      canisterId: targetCanisterId,
      segment
    });
  }

  const canisterId = Principal.fromText(notEmptyString(targetCanisterId) ? targetCanisterId : cId);

  const {snapshotId} = await loadSnapshotAndAssertOverwrite({canisterId, segment});

  await uploadExistingSnapshot({
    canisterId,
    snapshotId,
    segment,
    folder
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
