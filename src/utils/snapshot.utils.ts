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
