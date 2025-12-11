import {
  IcManagementCanister,
  type IcManagementDid,
  type ReadCanisterSnapshotMetadataParams,
  type ReadCanisterSnapshotMetadataResponse,
  type SnapshotParams,
  type UploadCanisterSnapshotDataParams,
  type UploadCanisterSnapshotMetadataParams
} from '@icp-sdk/canisters/ic-management';
import type {Principal} from '@icp-sdk/core/principal';
import {initAgent} from './agent.api';

export const canisterStop = async ({canisterId}: {canisterId: Principal}): Promise<void> => {
  const agent = await initAgent();

  const {stopCanister} = IcManagementCanister.create({
    agent
  });

  await stopCanister(canisterId);
};

export const canisterStart = async ({canisterId}: {canisterId: Principal}): Promise<void> => {
  const agent = await initAgent();

  const {startCanister} = IcManagementCanister.create({
    agent
  });

  await startCanister(canisterId);
};

export const takeCanisterSnapshot = async (params: {
  canisterId: Principal;
  snapshotId?: IcManagementDid.snapshot_id;
}): Promise<void> => {
  const agent = await initAgent();

  const {takeCanisterSnapshot} = IcManagementCanister.create({
    agent
  });

  await takeCanisterSnapshot(params);
};

export const listCanisterSnapshots = async (params: {
  canisterId: Principal;
}): Promise<IcManagementDid.list_canister_snapshots_result> => {
  const agent = await initAgent();

  const {listCanisterSnapshots} = IcManagementCanister.create({
    agent
  });

  return await listCanisterSnapshots(params);
};

export const loadCanisterSnapshot = async (params: {
  canisterId: Principal;
  snapshotId: IcManagementDid.snapshot_id;
}): Promise<void> => {
  const agent = await initAgent();

  const {loadCanisterSnapshot} = IcManagementCanister.create({
    agent
  });

  await loadCanisterSnapshot(params);
};

export const deleteCanisterSnapshot = async (params: {
  canisterId: Principal;
  snapshotId: IcManagementDid.snapshot_id;
}): Promise<void> => {
  const agent = await initAgent();

  const {deleteCanisterSnapshot} = IcManagementCanister.create({
    agent
  });

  await deleteCanisterSnapshot(params);
};

export const readCanisterSnapshotMetadata = async (
  params: SnapshotParams
): Promise<ReadCanisterSnapshotMetadataResponse> => {
  const agent = await initAgent();

  const {readCanisterSnapshotMetadata} = IcManagementCanister.create({
    agent
  });

  return await readCanisterSnapshotMetadata(params);
};

export const readCanisterSnapshotData = async (
  params: ReadCanisterSnapshotMetadataParams
): Promise<IcManagementDid.read_canister_snapshot_data_response> => {
  const agent = await initAgent();

  const {readCanisterSnapshotData} = IcManagementCanister.create({
    agent
  });

  return await readCanisterSnapshotData(params);
};

export const uploadCanisterSnapshotMetadata = async (
  params: UploadCanisterSnapshotMetadataParams
): Promise<IcManagementDid.upload_canister_snapshot_metadata_response> => {
  const agent = await initAgent();

  const {uploadCanisterSnapshotMetadata} = IcManagementCanister.create({
    agent
  });

  return await uploadCanisterSnapshotMetadata(params);
};

export const uploadCanisterSnapshotData = async (
  params: UploadCanisterSnapshotDataParams
): Promise<void> => {
  const agent = await initAgent();

  const {uploadCanisterSnapshotData} = IcManagementCanister.create({
    agent
  });

  await uploadCanisterSnapshotData(params);
};
