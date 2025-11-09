import {
  ICManagementCanister,
  type list_canister_snapshots_result,
  type read_canister_snapshot_data_response,
  type ReadCanisterSnapshotMetadataParams,
  type ReadCanisterSnapshotMetadataResponse,
  type snapshot_id,
  type SnapshotParams,
  type upload_canister_snapshot_metadata_response,
  type UploadCanisterSnapshotDataParams,
  type UploadCanisterSnapshotMetadataParams
} from '@dfinity/ic-management';
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

export const readCanisterSnapshotMetadata = async (
  params: SnapshotParams
): Promise<ReadCanisterSnapshotMetadataResponse> => {
  const agent = await initAgent();

  const {readCanisterSnapshotMetadata} = ICManagementCanister.create({
    agent
  });

  return await readCanisterSnapshotMetadata(params);
};

export const readCanisterSnapshotData = async (
  params: ReadCanisterSnapshotMetadataParams
): Promise<read_canister_snapshot_data_response> => {
  const agent = await initAgent();

  const {readCanisterSnapshotData} = ICManagementCanister.create({
    agent
  });

  return await readCanisterSnapshotData(params);
};

export const uploadCanisterSnapshotMetadata = async (
  params: UploadCanisterSnapshotMetadataParams
): Promise<upload_canister_snapshot_metadata_response> => {
  const agent = await initAgent();

  const {uploadCanisterSnapshotMetadata} = ICManagementCanister.create({
    agent
  });

  return await uploadCanisterSnapshotMetadata(params);
};

export const uploadCanisterSnapshotData = async (
  params: UploadCanisterSnapshotDataParams
): Promise<void> => {
  const agent = await initAgent();

  const {uploadCanisterSnapshotData} = ICManagementCanister.create({
    agent
  });

  await uploadCanisterSnapshotData(params);
};
