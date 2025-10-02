import type {snapshot_id} from '@dfinity/ic-management';
import {encodeSnapshotId} from '@dfinity/ic-management';
import {Principal} from '@dfinity/principal';
import {isEmptyString, isNullish, nonNullish} from '@dfinity/utils';
import {red, yellow} from 'kleur';
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
import {downloadExistingSnapshot} from './snapshot.download.services';
import {uploadExistingSnapshot} from './snapshot.upload.services';
import {nextArg} from '@junobuild/cli-tools';
import {existsSync, lstatSync} from 'node:fs';

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

  const result = await loadSnapshotAndAssertExist({canisterId, segment});

  if (result.result === 'not_found') {
    return;
  }

  const {snapshotId: existingSnapshotId} = result;

  await confirmAndExit(
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
  const canisterId = Principal.fromText(cId);

  const folder = nextArg({args, option: '--dir'});

  if (isEmptyString(folder)) {
    console.log(
      `You did not provide a ${yellow('directory')} that contains metadata.json and chunks to upload.`
    );
    return;
  }

  if (!existsSync(folder)) {
    console.log(`The directory ${yellow('directory')} does not exist.`);
    return;
  }

  if (!lstatSync(folder).isDirectory()) {
    console.log(red(`${folder} is not a directory.`));
    return;
  }

  // TODO: extract assertions
  // TODO: more assertion like is there a metadata.json and chunk files

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

const loadSnapshotAndAssertExist = async ({
  canisterId,
  segment
}: {
  canisterId: Principal;
  segment: AssetKey;
}): Promise<{result: 'ok'; snapshotId: snapshot_id} | {result: 'not_found'}> => {
  const existingSnapshotId = await loadSnapshot({canisterId});

  if (isNullish(existingSnapshotId)) {
    console.log(red(`No snapshot found for your ${displaySegment(segment)}.`));
    return {result: 'not_found'};
  }

  return {result: 'ok', snapshotId: existingSnapshotId};
};

const loadSnapshotAndAssertOverwrite = async ({
  canisterId,
  segment
}: {
  canisterId: Principal;
  segment: AssetKey;
}): Promise<{snapshotId: snapshot_id | undefined}> => {
  const existingSnapshotId = await loadSnapshot({canisterId});

  if (nonNullish(existingSnapshotId)) {
    await confirmAndExit(
      `A snapshot for your ${displaySegment(segment)} already exists with ID 0x${encodeSnapshotId(existingSnapshotId)}. Do you want to overwrite it?`
    );
  }

  return {snapshotId: existingSnapshotId};
};
