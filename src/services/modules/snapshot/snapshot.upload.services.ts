import type {snapshot_id} from '@dfinity/ic-management';
import type {Principal} from '@dfinity/principal';
import {isEmptyString} from '@dfinity/utils';
import {nextArg} from '@junobuild/cli-tools';
import {red, yellow} from 'kleur';
import {existsSync, lstatSync} from 'node:fs';
import ora from 'ora';
import type {AssetKey} from '../../../types/asset-key';
import {displaySegment} from '../../../utils/display.utils';

// We override the ic-mgmt interface because we solely want snapshotId as Principal here
interface SnapshotParams {
  canisterId: Principal;
  snapshotId?: snapshot_id;
}

// A handy wrapper to pass down a function that updates
// the spinner log.
interface SnapshotLog {
  log: (text: string) => void;
}

export const uploadExistingSnapshot = async ({
  segment,
  args,
  ...params
}: SnapshotParams & {
  segment: AssetKey;
  args?: string[];
}): Promise<void> => {
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

  const spinner = ora('Uploading the snapshot...').start();

  try {
    const result = await uploadSnapshotMetadataAndMemory({
      ...params,
      log: (text) => (spinner.text = text)
    });

    spinner.stop();

    const {snapshotIdText} = result;

    console.log(
      `✅ The snapshot ${snapshotIdText} for your ${displaySegment(segment)} has been uploaded.`
    );
  } catch (error: unknown) {
    spinner.stop();

    throw error;
  }
};

const uploadSnapshotMetadataAndMemory = async ({
  snapshotId,
  log,
  ...rest
}: SnapshotParams & SnapshotLog): Promise<{snapshotIdText: string}> => {
  // TODO: yep todo

  return {snapshotIdText: ""}
};
