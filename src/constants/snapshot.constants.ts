import {join} from 'node:path';

export const SNAPSHOTS_PATH = join(process.cwd(), '.snapshots');

// https://forum.dfinity.org/t/canister-snapshot-up-download/57397?u=peterparker
// Same value as INSTALL_MAX_CHUNK_SIZE in @junobuild/admin
export const SNAPSHOT_MAX_CHUNK_SIZE = 1_000_000n;
