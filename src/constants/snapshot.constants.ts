import {join} from 'node:path';

export const SNAPSHOTS_PATH = join(process.cwd(), '.snapshots');

// https://forum.dfinity.org/t/canister-snapshot-up-download/57397?u=peterparker
export const SNAPSHOT_CHUNK_SIZE = 1_000_000n;
