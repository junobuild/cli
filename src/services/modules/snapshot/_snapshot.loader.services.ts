import {isNullish, nonNullish} from '@dfinity/utils';
import type {IcManagementDid} from '@icp-sdk/canisters/ic-management';
import {encodeSnapshotId} from '@icp-sdk/canisters/ic-management';
import {type Principal} from '@icp-sdk/core/principal';
import {red} from 'kleur';
import ora from 'ora';
import {listCanisterSnapshots} from '../../../api/ic.api';
import type {AssetKey} from '../../../types/asset-key';
import {displaySegment} from '../../../utils/display.utils';
import {confirmAndExitUnlessHeadlessAndDev} from '../../../utils/prompt.utils';

const loadSnapshot = async ({
  canisterId
}: {
  canisterId: Principal;
}): Promise<IcManagementDid.snapshot_id | undefined> => {
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

export const loadSnapshotAndAssertExist = async ({
  canisterId,
  segment
}: {
  canisterId: Principal;
  segment: AssetKey;
}): Promise<{result: 'ok'; snapshotId: IcManagementDid.snapshot_id} | {result: 'not_found'}> => {
  const existingSnapshotId = await loadSnapshot({canisterId});

  if (isNullish(existingSnapshotId)) {
    console.log(red(`No snapshot found for your ${displaySegment(segment)}.`));
    return {result: 'not_found'};
  }

  return {result: 'ok', snapshotId: existingSnapshotId};
};

export const loadSnapshotAndAssertOverwrite = async ({
  canisterId,
  segment
}: {
  canisterId: Principal;
  segment: AssetKey;
}): Promise<{snapshotId: IcManagementDid.snapshot_id | undefined}> => {
  const existingSnapshotId = await loadSnapshot({canisterId});

  if (nonNullish(existingSnapshotId)) {
    await confirmAndExitUnlessHeadlessAndDev(
      `A snapshot for your ${displaySegment(segment)} already exists with ID 0x${encodeSnapshotId(existingSnapshotId)}. Do you want to overwrite it?`
    );
  }

  return {snapshotId: existingSnapshotId};
};
