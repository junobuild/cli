import {ICManagementCanister} from '@dfinity/ic-management';
import type {
  list_canister_snapshots_result,
  snapshot_id
} from '@dfinity/ic-management/dist/candid/ic-management';
import type {Principal} from '@dfinity/principal';
import {initAgent} from './agent.api';

export const canisterStop = async ({canisterId}: {canisterId: Principal}): Promise<void> => {
  const agent = await initAgent();

  const {stopCanister} = ICManagementCanister.create({
    agent
  });

  await stopCanister(canisterId);
};

export const canisterStart = async ({canisterId}: {canisterId: Principal}): Promise<void> => {
  const agent = await initAgent();

  const {startCanister} = ICManagementCanister.create({
    agent
  });

  await startCanister(canisterId);
};

export const takeCanisterSnapshot = async (params: {
  canisterId: Principal;
  snapshotId?: snapshot_id;
}): Promise<void> => {
  const agent = await initAgent();

  const {takeCanisterSnapshot} = ICManagementCanister.create({
    agent
  });

  await takeCanisterSnapshot(params);
};

export const listCanisterSnapshots = async (params: {
  canisterId: Principal;
}): Promise<list_canister_snapshots_result> => {
  const agent = await initAgent();

  const {listCanisterSnapshots} = ICManagementCanister.create({
    agent
  });

  return await listCanisterSnapshots(params);
};

export const loadCanisterSnapshot = async (params: {
  canisterId: Principal;
  snapshotId: snapshot_id;
}): Promise<void> => {
  const agent = await initAgent();

  const {loadCanisterSnapshot} = ICManagementCanister.create({
    agent
  });

  await loadCanisterSnapshot(params);
};

export const deleteCanisterSnapshot = async (params: {
  canisterId: Principal;
  snapshotId: snapshot_id;
}): Promise<void> => {
  const agent = await initAgent();

  const {deleteCanisterSnapshot} = ICManagementCanister.create({
    agent
  });

  await deleteCanisterSnapshot(params);
};
