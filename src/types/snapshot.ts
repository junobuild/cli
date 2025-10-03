import type {snapshot_id} from '@dfinity/ic-management';
import type {Principal} from '@dfinity/principal';
import * as z from 'zod';
import {
  ReadCanisterSnapshotMetadataResponseSchema,
  SnapshotFilenameSchema,
  SnapshotFileSchema,
  SnapshotMetadataSchema
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