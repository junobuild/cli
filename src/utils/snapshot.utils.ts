import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {Writable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {SNAPSHOT_MAX_CHUNK_SIZE} from '../constants/snapshot.constants';

export type BuildChunkFn<T> = (params: {offset: bigint; size: bigint}) => T;

export const prepareDataChunks = <T>({
  size: totalSize,
  build
}: {
  size: bigint;
  build: BuildChunkFn<T>;
}): {chunks: T[]} => {
  const chunks: T[] = [];

  for (let offset = 0n; offset < totalSize; offset += SNAPSHOT_MAX_CHUNK_SIZE) {
    const size =
      offset + SNAPSHOT_MAX_CHUNK_SIZE <= totalSize ? SNAPSHOT_MAX_CHUNK_SIZE : totalSize - offset;

    chunks.push({
      ...build({
        offset,
        size
      })
    });
  }

  return {chunks};
};

// TODO: we maybe want to move this elsewhere as it is not stricly related to snapshots
export const computeLargeFileHash = async (filepath: string): Promise<string> => {
  const hash = createHash('sha256');

  await pipeline(
    createReadStream(filepath),
    new Writable({
      write(chunk, _enc, cb) {
        hash.update(chunk);
        cb();
      }
    })
  );

  return hash.digest('hex');
};
