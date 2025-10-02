import {encodeSnapshotId, snapshot_id} from '@dfinity/ic-management';
import {UploadCanisterSnapshotDataKind} from '@dfinity/ic-management/dist/types/types/snapshot.params';
import type {Principal} from '@dfinity/principal';
import {arrayBufferToUint8Array, isNullish, jsonReviver} from '@dfinity/utils';
import {FileHandle} from 'fs/promises';
import {red} from 'kleur';
import {lstatSync} from 'node:fs';
import {open as openFile, readFile} from 'node:fs/promises';
import {join, relative} from 'node:path';
import ora from 'ora';
import {uploadCanisterSnapshotData, uploadCanisterSnapshotMetadata} from '../../../api/ic.api';
import type {AssetKey} from '../../../types/asset-key';
import {
  ReadCanisterSnapshotMetadataResponse,
  SnapshotFile,
  SnapshotMetadata,
  SnapshotMetadataSchema
} from '../../../types/snapshot';
import {displaySegment} from '../../../utils/display.utils';
import {BuildChunkFn, computeLargeFileHash, prepareDataChunks} from '../../../utils/snapshot.utils';

// We override the ic-mgmt interface because we solely want snapshotId as Principal here
interface SnapshotParams {
  canisterId: Principal;
  snapshotId?: snapshot_id;
}

// A handy wrapper to pass down a function that updates
// the spinner log.
interface SnapshotLog {
  log: (text: string) => void;
}

interface BatchResult {
  progress: {index: number; done: number; total: number};
}

interface DataChunk {
  kind: UploadCanisterSnapshotDataKind;
  offset: number;
  size: number;
}

class SnapshotAssertError extends Error {}
class SnapshotFsReadError extends Error {}

export const uploadExistingSnapshot = async ({
  segment,
  ...params
}: SnapshotParams & {
  segment: AssetKey;
  folder: string;
}): Promise<void> => {
  const spinner = ora('Uploading the snapshot...').start();

  try {
    const result = await uploadSnapshotMetadataAndMemory({
      ...params,
      log: (text) => (spinner.text = text)
    });

    spinner.stop();

    const {snapshotIdText} = result;

    console.log(
      `✅ The snapshot ${snapshotIdText} for your ${displaySegment(segment)} has been uploaded.`
    );
  } catch (error: unknown) {
    spinner.stop();

    if (error instanceof SnapshotFsReadError || error instanceof SnapshotAssertError) {
      console.log(red(error.message));
      return;
    }

    throw error;
  }
};

const uploadSnapshotMetadataAndMemory = async ({
  log,
  folder,
  snapshotId: replaceSnapshotId,
  ...rest
}: SnapshotParams & {folder: string} & SnapshotLog): Promise<{snapshotIdText: string}> => {
  // 1. Read the snapshot metadata
  const {
    metadata: {
      metadata,
      data: {wasmModule, wasmMemory, stableMemory, wasmChunkStore}
    }
  } = await readMetadata({folder, log});

  // 2. Upload the snapshot metadata - i.e. we need to upload first the metadata
  // because an existing snapshot is required to upload the chunk. Technically,
  // we can probably assert here, in case of replacement, if the existing snapshot
  // is equals to the one we upload but for simplicity reasons we upload every time.
  const {snapshotId} = await uploadMetadata({
    ...rest,
    snapshotId: replaceSnapshotId,
    metadata,
    log
  });

  const snapshotIdText = `0x${encodeSnapshotId(snapshotId)}`;

  // 3. Upload chunks
  await assertAndUploadChunks({
    ...rest,
    snapshotId,
    log,
    folder,
    file: wasmModule,
    build: ({offset, size}) => ({
      kind: {wasmModule: {offset}},
      offset: Number(offset),
      size: Number(size)
    })
  });

  await assertAndUploadChunks({
    ...rest,
    snapshotId,
    log,
    folder,
    file: wasmMemory,
    build: ({offset, size}) => ({
      kind: {wasmMemory: {offset}},
      offset: Number(offset),
      size: Number(size)
    })
  });

  await assertAndUploadChunks({
    ...rest,
    snapshotId,
    log,
    folder,
    file: stableMemory,
    build: ({offset, size}) => ({
      kind: {stableMemory: {offset}},
      offset: Number(offset),
      size: Number(size)
    })
  });

  await assertAndUploadChunks({
    ...rest,
    snapshotId,
    log,
    folder,
    file: wasmChunkStore,
    build: ({offset, size}) => ({
      kind: {wasmChunk: null},
      offset: Number(offset),
      size: Number(size)
    })
  });

  return {snapshotIdText};
};

const readMetadata = async ({
  folder,
  log
}: {folder: string} & SnapshotLog): Promise<{metadata: SnapshotMetadata}> => {
  log('Loading metadata...');

  const source = join(folder, 'metadata.json');

  const data = await readFile(source, 'utf-8');
  const metadata = JSON.parse(data, jsonReviver);

  return {metadata: SnapshotMetadataSchema.parse(metadata)};
};

const uploadMetadata = async ({
  log,
  metadata: {
    globals,
    certifiedData,
    globalTimer,
    onLowWasmMemoryHookStatus,
    wasmModuleSize,
    stableMemorySize,
    wasmMemorySize
  },
  ...rest
}: SnapshotParams & {metadata: ReadCanisterSnapshotMetadataResponse} & SnapshotLog): Promise<{
  snapshotId: snapshot_id;
}> => {
  log('Uploading snapshot metadata...');

  const {snapshot_id: snapshotId} = await uploadCanisterSnapshotMetadata({
    // Handpicked data to avoid sending unexpected data over the wire
    metadata: {
      globals,
      certifiedData,
      globalTimer,
      onLowWasmMemoryHookStatus,
      wasmModuleSize,
      stableMemorySize,
      wasmMemorySize
    },
    ...rest
  });

  return {snapshotId};
};

const assertAndUploadChunks = async ({
  folder,
  file,
  log,
  build,
  ...rest
}: Required<SnapshotParams> & {
  folder: string;
  file: SnapshotFile | null;
  build: BuildChunkFn<DataChunk>;
} & SnapshotLog): Promise<{status: 'success' | 'skip'}> => {
  if (isNullish(file)) {
    // We do not log a message to not make the developer think something is missing.
    return {status: 'skip'};
  }

  const {filename, size, hash} = file;

  const source = join(folder, filename);

  const actualSize = BigInt(lstatSync(source).size);
  if (size !== actualSize) {
    throw new SnapshotAssertError(
      `Size mismatch for ${filename}: expected ${size} bytes, got ${actualSize} bytes`
    );
  }

  const actualHash = await computeLargeFileHash(source);
  if (hash !== (await computeLargeFileHash(source))) {
    throw new SnapshotAssertError(
      `Hash mismatch for ${filename}: expected ${hash}, got ${actualHash}`
    );
  }

  const {chunks} = prepareDataChunks({size, build});

  log(`Uploading chunks from ${relative(process.cwd(), source)}...`);

  const sourceHandler = await openFile(source);

  try {
    for await (const {progress} of batchUploadChunks({
      sourceHandler,
      chunks,
      ...rest
    })) {
      log(`Chunks ${progress.done}/${progress.total} uploaded. Continuing...`);
    }
  } finally {
    await sourceHandler.close();
  }

  return {status: 'success'};
};

async function* batchUploadChunks({
  sourceHandler,
  chunks,
  limit = 20,
  ...params
}: Required<SnapshotParams> & {
  sourceHandler: FileHandle;
  chunks: DataChunk[];
  limit?: number;
}): AsyncGenerator<BatchResult, void> {
  const total = chunks.length;

  for (let i = 0; i < total; i = i + limit) {
    const batch = chunks.slice(i, i + limit);
    await Promise.all(
      batch.map((requestChunk) =>
        uploadChunk({
          ...params,
          sourceHandler,
          chunk: requestChunk
        })
      )
    );
    yield {progress: {index: i, done: Math.min(i + limit, total), total}};
  }
}

const uploadChunk = async ({
  chunk: {kind, size, offset},
  sourceHandler,
  ...rest
}: Required<SnapshotParams> & {
  sourceHandler: FileHandle;
  chunk: DataChunk;
}): Promise<void> => {
  const {buffer, bytesRead} = await sourceHandler.read(Buffer.alloc(size), 0, size, offset);

  if (bytesRead !== size) {
    throw new SnapshotFsReadError(`Unexpected bytes read: expected ${size} but got ${bytesRead}`);
  }

  await uploadCanisterSnapshotData({
    ...rest,
    kind,
    chunk: arrayBufferToUint8Array(buffer.buffer)
  });
};
