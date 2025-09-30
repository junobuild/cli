import {type CanisterSnapshotMetadataKind, encodeSnapshotId, type snapshot_id} from '@dfinity/ic-management';
import type {ReadCanisterSnapshotMetadataResponse} from '@dfinity/ic-management/dist/types/types/snapshot.responses';
import {type Principal} from '@dfinity/principal';
import {arrayOfNumberToUint8Array, jsonReplacer} from '@dfinity/utils';
import {red} from 'kleur';
import {existsSync} from 'node:fs';
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import ora from 'ora';
import {readCanisterSnapshotData, readCanisterSnapshotMetadata} from '../../../api/ic.api';
import {SNAPSHOT_CHUNK_SIZE, SNAPSHOTS_PATH} from '../../../constants/snapshot.constants';
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

  const {
    metadata: {wasmModuleSize}
  } = await downloadMetadata({folder, snapshotId, ...rest});

  await downloadChunks({
    folder,
    snapshotId,
    size: wasmModuleSize,
    build: (param) => ({wasmModule: param}),
    ...rest
  });

  await downloadChunks({
    folder,
    snapshotId,
    size: wasmModuleSize,
    build: (param) => ({wasmMemory: param}),
    ...rest
  });

  await downloadChunks({
    folder,
    snapshotId,
    size: wasmModuleSize,
    build: (param) => ({stableMemory: param}),
    ...rest
  });

  return {status: 'success', snapshotIdText};
};

type Chunk = Exclude<CanisterSnapshotMetadataKind, {wasmChunk: unknown}>;
type OrderedChunk = Chunk & {orderId: bigint};

type BuildChunkFn = (params: {offset: bigint; size: bigint}) => Chunk;

const downloadMetadata = async ({
  folder,
  ...rest
}: SnapshotParams & {folder: string}): Promise<{
  metadata: ReadCanisterSnapshotMetadataResponse;
}> => {
  const metadata = await readCanisterSnapshotMetadata(rest);

  const destination = join(folder, 'metadata.json');
  await writeFile(destination, JSON.stringify(metadata, jsonReplacer, 2), 'utf-8');

  return {metadata};
};

const downloadChunks = async ({
  size,
  build,
  ...params
}: SnapshotParams & {folder: string; size: bigint; build: BuildChunkFn}) => {
  const {chunks} = prepareDownloadChunks({size, build});

  for await (const progress of batchDownloadChunks({
    chunks,
    limit: 12,
    ...params
  })) {
    console.log(`Batch ${progress.index} of ${progress.total} done.`);
  }
};

const prepareDownloadChunks = ({
  size: totalSize,
  build
}: {
  size: bigint;
  build: BuildChunkFn;
}): {chunks: OrderedChunk[]} => {
  let orderId = 0n;

  const chunks: OrderedChunk[] = [];

  for (let offset = 0n; offset < totalSize; offset += SNAPSHOT_CHUNK_SIZE) {
    const size =
      offset + SNAPSHOT_CHUNK_SIZE <= totalSize ? SNAPSHOT_CHUNK_SIZE : totalSize - offset;

    chunks.push({
      ...build({
        offset,
        size
      }),
      orderId
    });

    orderId++;
  }

  return {chunks};
};

async function* batchDownloadChunks({
  chunks,
  limit = 12,
  ...params
}: SnapshotChunkFsParams & {
  chunks: OrderedChunk[];
  limit?: number;
}): AsyncGenerator<{index: number; total: number}, void> {
  for (let i = 0; i < chunks.length; i = i + limit) {
    const batch = chunks.slice(i, i + limit);
    await Promise.all(
      batch.map(async (requestChunk) =>
        { await downloadChunk({
          ...params,
          chunk: requestChunk
        }); }
      )
    );
    yield {index: i, total: chunks.length};
  }
}

interface SnapshotChunkFsParams extends SnapshotParams {
  folder: string;
}

const downloadChunk = async ({
  chunk: {orderId, ...kind},
  folder,
  ...rest
}: SnapshotChunkFsParams & {
  chunk: OrderedChunk;
}): Promise<void> => {
  const {chunk: downloadedChunk} = await readCanisterSnapshotData({
    ...rest,
    kind
  });

  const filename = Object.keys(kind)[0].toLowerCase();

  // Note: we would not win much at gzipping the data.
  const destination = join(folder, `${filename}-${orderId}.bin`);
  await writeFile(
    destination,
    downloadedChunk instanceof Uint8Array
      ? downloadedChunk
      : arrayOfNumberToUint8Array(downloadedChunk)
  );
};
