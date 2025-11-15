import type {snapshot_id} from '@icp-sdk/canisters/ic-management';
import type {Principal} from '@icp-sdk/core/principal';
import type * as z from 'zod';
import {
  type ReadCanisterSnapshotMetadataResponseSchema,
  type SnapshotFilenameSchema,
  type SnapshotFileSchema,
  type SnapshotMetadataSchema
} from '../schema/snapshot.schema';

export type SnapshotFilename = z.infer<typeof SnapshotFilenameSchema>;
export type SnapshotFile = z.infer<typeof SnapshotFileSchema>;
export type SnapshotMetadata = z.infer<typeof SnapshotMetadataSchema>;
export type ReadCanisterSnapshotMetadataResponse = z.infer<
  typeof ReadCanisterSnapshotMetadataResponseSchema
>;

export interface DownloadSnapshotParams {
  canisterId: Principal;
  snapshotId: snapshot_id;
}

export type UploadSnapshotParams = Omit<DownloadSnapshotParams, 'snapshotId'> &
  Partial<Pick<DownloadSnapshotParams, 'snapshotId'>>;

// A handy wrapper to pass down a function that updates
// the spinner log.
export interface SnapshotLog {
  log: (text: string) => void;
}

export interface SnapshotBatchResult {
  progress: {index: number; done: number; total: number};
}
