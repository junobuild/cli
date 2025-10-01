import type {snapshot_id} from '@dfinity/ic-management';
import {type CanisterSnapshotMetadataKind, encodeSnapshotId} from '@dfinity/ic-management';
import type {ReadCanisterSnapshotMetadataResponse} from '@dfinity/ic-management/dist/types/types/snapshot.responses';
import type {Principal} from '@dfinity/principal';
import {arrayOfNumberToUint8Array, jsonReplacer} from '@dfinity/utils';
import {red} from 'kleur';
import {createWriteStream, existsSync} from 'node:fs';
import {mkdir, writeFile} from 'node:fs/promises';
import {join, relative} from 'node:path';
import {Readable, Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
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

type RequestedChunk = CanisterSnapshotMetadataKind;
type DownloadedChunk = Uint8Array;
type BuildChunkFn = (params: {offset: bigint; size: bigint}) => RequestedChunk;

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

interface BatchResult {
  downloadedChunks: DownloadedChunk[];
  progress: {index: number; done: number; total: number};
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
    filename: 'wasm-code',
    snapshotId,
    size: wasmModuleSize,
    build: (param) => ({wasmModule: param}),
    log,
    ...rest
  });

  await assertSizeAndDownloadChunks({
    folder,
    filename: 'heap',
    snapshotId,
    size: wasmMemorySize,
    build: (param) => ({wasmMemory: param}),
    log,
    ...rest
  });

  await assertSizeAndDownloadChunks({
    folder,
    filename: 'stable',
    snapshotId,
    size: stableMemorySize,
    build: (param) => ({stableMemory: param}),
    log,
    ...rest
  });

  await assertAndDownloadWasmChunks({
    folder,
    filename: 'chunks-store',
    snapshotId,
    wasmChunkStore,
    log,
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
  log(`Downloading snapshot metadata ${snapshotIdText}...`);

  const metadata = await readCanisterSnapshotMetadata(rest);

  // TODO: write the metadata at the end of the process. It's safer.
  const destination = join(folder, 'metadata.json');
  await writeFile(destination, JSON.stringify(metadata, jsonReplacer, 2), 'utf-8');

  return {metadata};
};

const assertSizeAndDownloadChunks = async ({
  size,
  log,
  filename,
  ...params
}: SnapshotParams & {
  folder: string;
  filename: string;
  size: bigint;
  build: BuildChunkFn;
} & SnapshotLog) => {
  if (size === 0n) {
    log(`No chunks to download for ${filename} (size = 0). Skipping.`);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return;
  }

  await downloadMemoryChunks({
    size,
    log,
    filename,
    ...params
  });
};

const assertAndDownloadWasmChunks = async ({
  wasmChunkStore,
  log,
  ...params
}: SnapshotParams & {folder: string; filename: string} & Pick<
    ReadCanisterSnapshotMetadataResponse,
    'wasmChunkStore'
  > &
  SnapshotLog) => {
  if (wasmChunkStore.length === 0) {
    log('Nothing to download from the WASM chunks store (length = 0). Skipping.');
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
  folder,
  filename,
  ...params
}: SnapshotParams & {
  folder: string;
  filename: string;
  size: bigint;
  build: BuildChunkFn;
} & SnapshotLog) => {
  const {chunks} = prepareDownloadChunks({size, build});

  const readable = Readable.from(
    batchDownloadChunks({
      chunks,
      limit: 20,
      ...params
    })
  );

  await downloadAndWrite({readable, folder, filename, log});
};

const downloadWasmChunks = async ({
  wasmChunkStore,
  log,
  folder,
  filename,
  ...params
}: SnapshotParams & {folder: string; filename: string} & Pick<
    ReadCanisterSnapshotMetadataResponse,
    'wasmChunkStore'
  > &
  SnapshotLog) => {
  const readable = Readable.from(
    batchDownloadChunks({
      chunks: wasmChunkStore.map((chunk, orderId) => ({wasmChunk: chunk, orderId})),
      limit: 12,
      ...params
    })
  );

  await downloadAndWrite({readable, folder, filename, log});
};

const downloadAndWrite = async ({
  readable,
  folder,
  filename,
  log
}: {readable: Readable; folder: string; filename: string} & SnapshotLog) => {
  // Note: we would not win much at gzipping the data.
  const destination = join(folder, `${filename}.bin`);

  log(`Downloading chunks to ${relative(process.cwd(), destination)}...`);

  const transformer = new Transform({
    objectMode: true,
    writableObjectMode: true,
    readableObjectMode: false,
    transform({downloadedChunks: chunks, progress}: BatchResult, _enc, cb) {
      try {
        log(`Chunks ${progress.done}/${progress.total} downloaded. Continuing...`);

        for (const chunk of chunks) {
          this.push(chunk);
        }
        cb();
      } catch (err: unknown) {
        cb(err as Error);
      }
    }
  });

  await pipeline(readable, transformer, createWriteStream(destination));
};

const prepareDownloadChunks = ({
  size: totalSize,
  build
}: {
  size: bigint;
  build: BuildChunkFn;
}): {chunks: RequestedChunk[]} => {
  const chunks: RequestedChunk[] = [];

  for (let offset = 0n; offset < totalSize; offset += SNAPSHOT_CHUNK_SIZE) {
    const size =
      offset + SNAPSHOT_CHUNK_SIZE <= totalSize ? SNAPSHOT_CHUNK_SIZE : totalSize - offset;

    chunks.push({
      ...build({
        offset,
        size
      })
    });
  }

  return {chunks};
};

async function* batchDownloadChunks({
  chunks,
  limit = 12,
  ...params
}: SnapshotParams & {
  chunks: RequestedChunk[];
  limit?: number;
}): AsyncGenerator<BatchResult, void> {
  const total = chunks.length;

  for (let i = 0; i < total; i = i + limit) {
    const batch = chunks.slice(i, i + limit);
    const downloadedChunks = await Promise.all(
      batch.map((requestChunk) =>
        downloadChunk({
          ...params,
          chunk: requestChunk
        })
      )
    );
    yield {downloadedChunks, progress: {index: i, done: Math.min(i + limit, total), total}};
  }
}

const downloadChunk = async ({
  chunk: kind,
  ...rest
}: SnapshotParams & {
  chunk: RequestedChunk;
}): Promise<DownloadedChunk> => {
  const {chunk: downloadedChunk} = await readCanisterSnapshotData({
    ...rest,
    kind
  });

  return downloadedChunk instanceof Uint8Array
    ? downloadedChunk
    : arrayOfNumberToUint8Array(downloadedChunk);
};
