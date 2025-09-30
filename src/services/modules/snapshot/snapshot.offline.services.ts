import {CanisterSnapshotMetadataKind, encodeSnapshotId, snapshot_id} from '@dfinity/ic-management';
import {read_canister_snapshot_data_response} from '@dfinity/ic-management/dist/candid/ic-management';
import {Principal} from '@dfinity/principal';
import {jsonReplacer} from '@dfinity/utils';
import {red} from 'kleur';
import {existsSync} from 'node:fs';
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import ora from 'ora';
import {readCanisterSnapshotData, readCanisterSnapshotMetadata} from '../../../api/ic.api';
import {SNAPSHOTS_PATH} from '../../../constants/snapshot.constants';
import type {AssetKey} from '../../../types/asset-key';
import {displaySegment} from '../../../utils/display.utils';

interface SnapshotParams {
  canisterId: Principal;
  snapshotId: snapshot_id;
}

export const downloadExistingSnapshot = async ({
  segment,
  ...params
}: SnapshotParams & {
  segment: AssetKey;
}): Promise<void> => {
  const spinner = ora('Downloading the snapshot...').start();

  try {
    const result = await downloadSnapshotMetadataAndMemory(params);

    spinner.stop();

    if (result.status === 'error') {
      console.log(
        `${red('Cannot proceed with download.')}\nDestination ${result.err.folder} already exists.`
      );
      return;
    }

    console.log(`✅ The snapshot for your ${displaySegment(segment)} was downloaded.`);
  } catch (error: unknown) {
    spinner.stop();

    throw error;
  }
};

class SnapshotFsError extends Error {
  constructor(public readonly folder: string) {
    super();
  }
}

const downloadSnapshotMetadataAndMemory = async ({
  snapshotId,
  ...rest
}: SnapshotParams): Promise<
  {status: 'success'; snapshotIdText: string} | {status: 'error'; err: SnapshotFsError}
> => {
  const snapshotIdText = `0x${encodeSnapshotId(snapshotId)}`;
  const folder = join(SNAPSHOTS_PATH, snapshotIdText);

  if (existsSync(folder)) {
    return {status: 'error', err: new SnapshotFsError(folder)};
  }

  await mkdir(folder, {recursive: true});

  const metadata = await readCanisterSnapshotMetadata({snapshotId, ...rest});

  const destination = join(folder, 'metadata.json');
  await writeFile(destination, JSON.stringify(metadata, jsonReplacer, 2), 'utf-8');

  return {status: 'success', snapshotIdText};
};

type RequestChunk = Exclude<CanisterSnapshotMetadataKind, {wasmChunk: unknown}>;

type Chunk = read_canister_snapshot_data_response['chunk'];

const downloadWasmModule = async ({}: SnapshotParams) => {};

const batchDownloadChunks = async (params: SnapshotParams) => {
  let chunks: Chunk[] = [];
  for await (const results of batchUploadChunks({requestedChunks: [], ...params})) {
    chunks = [...chunks, ...results];
  }
};

async function* batchUploadChunks({
  requestedChunks,
  limit = 12,
  ...params
}: SnapshotParams & {
  requestedChunks: RequestChunk[];
  limit?: number;
}): AsyncGenerator<Chunk[], void> {
  for (let i = 0; i < requestedChunks.length; i = i + limit) {
    const batch = requestedChunks.slice(i, i + limit);
    const result = await Promise.all(
      batch.map((requestChunk) =>
        downloadChunk({
          ...params,
          requestChunk
        })
      )
    );
    yield result;
  }
}

const downloadChunk = async ({
  requestChunk: kind,
  ...rest
}: SnapshotParams & {
  requestChunk: RequestChunk;
}): Promise<Chunk> => {
  const {chunk} = await readCanisterSnapshotData({
    ...rest,
    kind
  });

  return chunk;
};
