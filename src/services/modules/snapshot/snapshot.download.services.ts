import type {snapshot_id} from '@dfinity/ic-management';
import {type CanisterSnapshotMetadataKind, encodeSnapshotId} from '@dfinity/ic-management';
import type {ReadCanisterSnapshotMetadataResponse} from '@dfinity/ic-management/dist/types/types/snapshot.responses';
import type {Principal} from '@dfinity/principal';
import {arrayOfNumberToUint8Array, jsonReplacer} from '@dfinity/utils';
import {red} from 'kleur';
import {existsSync} from 'node:fs';
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import ora from 'ora';
import {readCanisterSnapshotData, readCanisterSnapshotMetadata} from '../../../api/ic.api';
import {SNAPSHOT_CHUNK_SIZE, SNAPSHOTS_PATH} from '../../../constants/snapshot.constants';
import {AssetKey} from '../../../types/asset-key';
import {displaySegment} from '../../../utils/display.utils';

// We override the ic-mgmt interface because we solely want snapshotId as Principal here
interface SnapshotParams {
  canisterId: Principal;
  snapshotId: snapshot_id;
}

type Chunk = CanisterSnapshotMetadataKind;
type OrderedChunk = Chunk & {orderId: number};

type BuildChunkFn = (params: {offset: bigint; size: bigint}) => Chunk;

class SnapshotFsFolderError extends Error {
  constructor(public readonly folder: string) {
    super();
  }
}

// A handy wrapper to pass down a function that updates
// the spinner log.
interface SnapshotLog {
  log: (text: string) => void;
}

export const downloadExistingSnapshot = async ({
  segment,
  ...params
}: SnapshotParams & {
  segment: AssetKey;
}): Promise<void> => {
  const spinner = ora('Downloading the snapshot...').start();

  try {
    const result = await downloadSnapshotMetadataAndMemory({
      ...params,
      log: (text) => (spinner.text = text)
    });

    spinner.stop();

    if (result.status === 'error') {
      console.log(
        `${red('Cannot proceed with download.')}\nDestination ${result.err.folder} already exists.`
      );
      return;
    }

    const {snapshotIdText, folder} = result;

    console.log(
      `✅ The snapshot ${snapshotIdText} for your ${displaySegment(segment)} has been downloaded.`
    );
    console.log(`🗂️  Files saved to ${folder}`);
  } catch (error: unknown) {
    spinner.stop();

    throw error;
  }
};

const downloadSnapshotMetadataAndMemory = async ({
  snapshotId,
  log,
  ...rest
}: SnapshotParams & SnapshotLog): Promise<
  | {status: 'success'; snapshotIdText: string; folder: string}
  | {status: 'error'; err: SnapshotFsFolderError}
> => {
  const snapshotIdText = `0x${encodeSnapshotId(snapshotId)}`;
  const folder = join(SNAPSHOTS_PATH, snapshotIdText);

  if (existsSync(folder)) {
    return {status: 'error', err: new SnapshotFsFolderError(folder)};
  }

  await mkdir(folder, {recursive: true});

  const {
    metadata: {wasmModuleSize, wasmMemorySize, stableMemorySize, wasmChunkStore}
  } = await downloadMetadata({folder, snapshotId, log, snapshotIdText, ...rest});

  await assertSizeAndDownloadChunks({
    folder,
    snapshotId,
    size: wasmModuleSize,
    build: (param) => ({wasmModule: param}),
    log: (text) => log(`[WASM module] ${text}`),
    ...rest
  });

  await assertSizeAndDownloadChunks({
    folder,
    snapshotId,
    size: wasmMemorySize,
    build: (param) => ({wasmMemory: param}),
    log: (text) => log(`[Heap memory] ${text}`),
    ...rest
  });

  await assertSizeAndDownloadChunks({
    folder,
    snapshotId,
    size: stableMemorySize,
    build: (param) => ({stableMemory: param}),
    log: (text) => log(`[Stable memory] ${text}`),
    ...rest
  });

  await assertAndDownloadWasmChunks({
    folder,
    snapshotId,
    wasmChunkStore,
    log: (text) => log(`[WASM store] ${text}`),
    ...rest
  });

  return {status: 'success', snapshotIdText, folder};
};

const downloadMetadata = async ({
  folder,
  snapshotIdText,
  log,
  ...rest
}: SnapshotParams & {folder: string; snapshotIdText: string} & SnapshotLog): Promise<{
  metadata: ReadCanisterSnapshotMetadataResponse;
}> => {
  log(`[Metadata] Downloading snapshot ${snapshotIdText}...`);

  const metadata = await readCanisterSnapshotMetadata(rest);

  const destination = join(folder, 'metadata.json');
  await writeFile(destination, JSON.stringify(metadata, jsonReplacer, 2), 'utf-8');

  return {metadata};
};

const assertSizeAndDownloadChunks = async ({
  size,
  log,
  ...params
}: SnapshotParams & {folder: string; size: bigint; build: BuildChunkFn} & SnapshotLog) => {
  if (size === 0n) {
    log('No chunks to download (size = 0). Skipping.');
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return;
  }

  await downloadMemoryChunks({
    size,
    log,
    ...params
  });
};

const assertAndDownloadWasmChunks = async ({
  wasmChunkStore,
  log,
  ...params
}: SnapshotParams & {folder: string} & Pick<
    ReadCanisterSnapshotMetadataResponse,
    'wasmChunkStore'
  > &
  SnapshotLog) => {
  if (wasmChunkStore.length === 0) {
    log('No chunks to download (length = 0). Skipping.');
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return;
  }

  await downloadWasmChunks({
    wasmChunkStore,
    log,
    ...params
  });
};

const downloadMemoryChunks = async ({
  size,
  build,
  log,
  ...params
}: SnapshotParams & {folder: string; size: bigint; build: BuildChunkFn} & SnapshotLog) => {
  const {chunks} = prepareDownloadChunks({size, build});

  log('Downloading chunks...');

  for await (const progress of batchDownloadChunks({
    chunks,
    limit: 20,
    ...params
  })) {
    log(`Chunks ${progress.done}/${progress.total} downloaded. Continuing...`);
  }
};

const downloadWasmChunks = async ({
  wasmChunkStore,
  log,
  ...params
}: SnapshotParams & {folder: string} & Pick<
    ReadCanisterSnapshotMetadataResponse,
    'wasmChunkStore'
  > &
  SnapshotLog) => {
  log('[WASM store] Downloading chunks...');

  for await (const progress of batchDownloadChunks({
    chunks: wasmChunkStore.map((chunk, orderId) => ({wasmChunk: chunk, orderId})),
    limit: 12,
    ...params
  })) {
    log(`Chunks ${progress.done}/${progress.total} downloaded. Continuing...`);
  }
};

const prepareDownloadChunks = ({
  size: totalSize,
  build
}: {
  size: bigint;
  build: BuildChunkFn;
}): {chunks: OrderedChunk[]} => {
  let orderId = 0;

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

    orderId += 1;
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
}): AsyncGenerator<{index: number; done: number; total: number}, void> {
  const total = chunks.length;

  for (let i = 0; i < total; i = i + limit) {
    const batch = chunks.slice(i, i + limit);
    await Promise.all(
      batch.map(async (requestChunk) => {
        await downloadChunk({
          ...params,
          chunk: requestChunk
        });
      })
    );
    yield {index: i, done: Math.min(i + limit, total), total};
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
