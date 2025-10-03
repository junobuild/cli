import type {snapshot_id} from '@dfinity/ic-management';
import {encodeSnapshotId} from '@dfinity/ic-management';
import {Principal} from '@dfinity/principal';
import {nonNullish, notEmptyString} from '@dfinity/utils';
import {findJunoPackageDependency, getJunoPackage} from '@junobuild/admin';
import {nextArg} from '@junobuild/cli-tools';
import {
  JUNO_PACKAGE_MISSION_CONTROL_ID,
  JUNO_PACKAGE_ORBITER_ID,
  JUNO_PACKAGE_SATELLITE_ID
} from '@junobuild/config';
import ora from 'ora';
import {actorParameters} from '../../../api/actor.api';
import {
  deleteCanisterSnapshot,
  loadCanisterSnapshot,
  takeCanisterSnapshot
} from '../../../api/ic.api';
import type {AssetKey} from '../../../types/asset-key';
import {displaySegment} from '../../../utils/display.utils';
import {assertNonNullishFolderExists} from '../../../utils/fs.utils';
import {confirmAndExit} from '../../../utils/prompt.utils';
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
  assertNonNullishFolderExists(folder);

  const targetCanisterId = nextArg({args, option: '--target-id'});

  if (notEmptyString(targetCanisterId)) {
    // TODO: extract into a service we can reuse for upgrade as well
    const actorParams = await actorParameters();

    const pkg = await getJunoPackage({
      moduleId: targetCanisterId,
      ...actorParams
    });

    const validJunoPackage = (): {valid: boolean} => {
      if (segment === 'mission_control') {
        return {valid: pkg?.name === JUNO_PACKAGE_MISSION_CONTROL_ID};
      }

      if (segment === 'orbiter') {
        return {valid: pkg?.name === JUNO_PACKAGE_ORBITER_ID};
      }

      // It's stock
      if (pkg?.name === JUNO_PACKAGE_SATELLITE_ID) {
        return {valid: true};
      }

      const {dependencies} = pkg ?? {dependencies: {}};

      const satelliteDependency = findJunoPackageDependency({
        dependencies,
        dependencyId: JUNO_PACKAGE_SATELLITE_ID
      });

      return {valid: nonNullish(satelliteDependency)};
    };

    const {valid} = validJunoPackage();

    if (!valid) {
      await confirmAndExit(
        `⚠️  The selected target is not a ${displaySegment(segment)}; this may cause issues if restored later. Are you sure you want to continue?`
      );
    }
  }

  const {snapshotId} = await loadSnapshotAndAssertOverwrite({canisterId, segment});

  await uploadExistingSnapshot({
    canisterId: notEmptyString(targetCanisterId) ? Principal.from(targetCanisterId) : canisterId,
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
