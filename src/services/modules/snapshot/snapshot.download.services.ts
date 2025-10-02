import type {snapshot_id} from '@dfinity/ic-management';
import {type CanisterSnapshotMetadataKind, encodeSnapshotId} from '@dfinity/ic-management';
import type {ReadCanisterSnapshotMetadataResponse} from '@dfinity/ic-management/dist/types/types/snapshot.responses';
import type {Principal} from '@dfinity/principal';
import {arrayOfNumberToUint8Array, jsonReplacer} from '@dfinity/utils';
import {red} from 'kleur';
import {createHash} from 'node:crypto';
import {createWriteStream, existsSync, statSync} from 'node:fs';
import {mkdir, writeFile} from 'node:fs/promises';
import {join, relative} from 'node:path';
import {Readable, Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import ora from 'ora';
import {readCanisterSnapshotData, readCanisterSnapshotMetadata} from '../../../api/ic.api';
import {SNAPSHOT_CHUNK_SIZE, SNAPSHOTS_PATH} from '../../../constants/snapshot.constants';
import {AssetKey} from '../../../types/asset-key';
import {SnapshotFile, SnapshotFilename, SnapshotMetadata} from '../../../types/snapshot';
import {displaySegment} from '../../../utils/display.utils';
import {BuildChunkFn, prepareDataChunks} from '../../../utils/snapshot.utils';

// We override the ic-mgmt interface because we solely want snapshotId as Principal here
interface SnapshotParams {
  canisterId: Principal;
  snapshotId: snapshot_id;
}

type DataChunk = CanisterSnapshotMetadataKind;
type DownloadedChunk = Uint8Array;

class SnapshotFsFolderError extends Error {
  constructor(public readonly folder: string) {
    super();
  }
}

class SnapshotFsSizeError extends Error {
  constructor(
    public readonly filename: string,
    public readonly expectedSize: bigint,
    public readonly downloadedSize: bigint
  ) {
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
  const spinner = ora().start();

  try {
    const result = await downloadSnapshotMetadataAndMemory({
      ...params,
      log: (text) => (spinner.text = text)
    });

    spinner.stop();

    const {snapshotIdText, folder} = result;

    console.log(
      `✅ The snapshot ${snapshotIdText} for your ${displaySegment(segment)} has been downloaded.`
    );
    console.log(`🗂️  Files saved to ${folder}`);
  } catch (error: unknown) {
    spinner.stop();

    if (error instanceof SnapshotFsFolderError) {
      console.log(
        `${red('Cannot proceed with download.')}\nDestination ${error.folder} already exists.`
      );
      return;
    }

    if (error instanceof SnapshotFsSizeError) {
      console.log(
        `${red('Download size mismatch.')}\n${error.filename}: expected ${error.expectedSize} bytes, got ${error.downloadedSize} bytes.`
      );
      return;
    }

    throw error;
  }
};

const downloadSnapshotMetadataAndMemory = async ({
  snapshotId,
  log,
  ...rest
}: SnapshotParams & SnapshotLog): Promise<{
  status: 'success';
  snapshotIdText: string;
  folder: string;
}> => {
  const snapshotIdText = `0x${encodeSnapshotId(snapshotId)}`;
  const folder = join(SNAPSHOTS_PATH, snapshotIdText);

  if (existsSync(folder)) {
    throw new SnapshotFsFolderError(folder);
  }

  await mkdir(folder, {recursive: true});

  // 1. Load the snapshot metadata
  const {metadata} = await loadMetadata({snapshotId, log, snapshotIdText, ...rest});

  // 2. Download the snapshot data (WASM program code, heap and stable memory, WASM chunks store)
  const {wasmModuleSize, wasmMemorySize, stableMemorySize, wasmChunkStore} = metadata;

  const wasmModuleResult = await assertSizeAndDownloadChunks({
    folder,
    filename: 'wasm-code.bin',
    snapshotId,
    size: wasmModuleSize,
    build: (param) => ({wasmModule: param}),
    log,
    ...rest
  });

  const wasmMemoryResult = await assertSizeAndDownloadChunks({
    folder,
    filename: 'heap.bin',
    snapshotId,
    size: wasmMemorySize,
    build: (param) => ({wasmMemory: param}),
    log,
    ...rest
  });

  const stableMemoryResult = await assertSizeAndDownloadChunks({
    folder,
    filename: 'stable.bin',
    snapshotId,
    size: stableMemorySize,
    build: (param) => ({stableMemory: param}),
    log,
    ...rest
  });

  const wasmChunkStoreResult = await assertAndDownloadWasmChunks({
    folder,
    filename: 'chunks-store.bin',
    snapshotId,
    wasmChunkStore,
    log,
    ...rest
  });

  // 3. Save the metadata of the offline snapshot
  await saveMetadata({
    log,
    folder,
    metadata: {
      snapshotId: snapshotIdText,
      metadata,
      data: {
        wasmModule: 'ok' === wasmModuleResult.status ? wasmModuleResult.snapshotFile : null,
        wasmMemory: 'ok' === wasmMemoryResult.status ? wasmMemoryResult.snapshotFile : null,
        stableMemory: 'ok' === stableMemoryResult.status ? stableMemoryResult.snapshotFile : null,
        wasmChunkStore:
          'ok' === wasmChunkStoreResult.status ? wasmChunkStoreResult.snapshotFile : null
      }
    }
  });

  return {status: 'success', snapshotIdText, folder};
};

const loadMetadata = async ({
  snapshotIdText,
  log,
  ...rest
}: SnapshotParams & {snapshotIdText: string} & SnapshotLog): Promise<{
  metadata: ReadCanisterSnapshotMetadataResponse;
}> => {
  log(`Downloading snapshot metadata ${snapshotIdText}...`);

  const metadata = await readCanisterSnapshotMetadata(rest);
  return {metadata};
};

const saveMetadata = async ({
  folder,
  log,
  metadata
}: {folder: string; metadata: SnapshotMetadata} & SnapshotLog) => {
  log(`Saving snapshot metadata...`);

  const destination = join(folder, 'metadata.json');
  await writeFile(destination, JSON.stringify(metadata, jsonReplacer, 2), 'utf-8');
};

const assertSizeAndDownloadChunks = async ({
  size,
  log,
  filename,
  ...params
}: SnapshotParams & {
  folder: string;
  filename: SnapshotFilename;
  size: bigint;
  build: BuildChunkFn<DataChunk>;
} & SnapshotLog): Promise<{status: 'ok'; snapshotFile: SnapshotFile} | {status: 'skip'}> => {
  if (size === 0n) {
    log(`No chunks to download for ${filename} (size = 0). Skipping.`);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return {status: 'skip'};
  }

  const {size: downloadedSize, hash} = await downloadMemoryChunks({
    size,
    log,
    filename,
    ...params
  });

  if (downloadedSize !== size) {
    throw new SnapshotFsSizeError(filename, size, downloadedSize);
  }

  return {
    status: 'ok',
    snapshotFile: {
      filename,
      size: downloadedSize,
      hash
    }
  };
};

const assertAndDownloadWasmChunks = async ({
  wasmChunkStore,
  log,
  ...params
}: SnapshotParams & {folder: string; filename: SnapshotFilename} & Pick<
    ReadCanisterSnapshotMetadataResponse,
    'wasmChunkStore'
  > &
  SnapshotLog): Promise<{status: 'ok'; snapshotFile: SnapshotFile} | {status: 'skip'}> => {
  if (wasmChunkStore.length === 0) {
    log('Nothing to download from the WASM chunks store (length = 0). Skipping.');
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return {status: 'skip'};
  }

  const snapshotFile = await downloadWasmChunks({
    wasmChunkStore,
    log,
    ...params
  });

  return {status: 'ok', snapshotFile};
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
  filename: SnapshotFilename;
  size: bigint;
  build: BuildChunkFn<DataChunk>;
} & SnapshotLog): Promise<SnapshotFile> => {
  const {chunks} = prepareDataChunks({size, build});

  const readable = Readable.from(
    batchDownloadChunks({
      chunks,
      ...params
    })
  );

  return await downloadAndWrite({readable, folder, filename, log});
};

const downloadWasmChunks = async ({
  wasmChunkStore,
  log,
  folder,
  filename,
  ...params
}: SnapshotParams & {folder: string; filename: SnapshotFilename} & Pick<
    ReadCanisterSnapshotMetadataResponse,
    'wasmChunkStore'
  > &
  SnapshotLog): Promise<SnapshotFile> => {
  const readable = Readable.from(
    batchDownloadChunks({
      chunks: wasmChunkStore.map((chunk, orderId) => ({wasmChunk: chunk, orderId})),
      limit: 12,
      ...params
    })
  );

  return await downloadAndWrite({readable, folder, filename, log});
};

const downloadAndWrite = async ({
  readable,
  folder,
  filename,
  log
}: {
  readable: Readable;
  folder: string;
  filename: SnapshotFilename;
} & SnapshotLog): Promise<SnapshotFile> => {
  // Note: we would not win much at gzipping the data.
  const destination = join(folder, filename);

  log(`Downloading chunks to ${relative(process.cwd(), destination)}...`);

  // A transformer use to flatten the back of chunks when writing to the file
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

  // We want to compute a sha256 to assert the file in the upload process
  const hash = createHash('sha256');

  const hasher = new Transform({
    transform(chunk, _enc, cb) {
      hash.update(chunk);
      cb(null, chunk);
    }
  });

  await pipeline(readable, transformer, hasher, createWriteStream(destination));

  return {
    filename,
    size: BigInt(statSync(destination).size),
    hash: hash.digest('hex')
  };
};

async function* batchDownloadChunks({
  chunks,
  limit = 20,
  ...params
}: SnapshotParams & {
  chunks: DataChunk[];
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
  chunk: DataChunk;
}): Promise<DownloadedChunk> => {
  const {chunk: downloadedChunk} = await readCanisterSnapshotData({
    ...rest,
    kind
  });

  return downloadedChunk instanceof Uint8Array
    ? downloadedChunk
    : arrayOfNumberToUint8Array(downloadedChunk);
};
