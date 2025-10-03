import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {Writable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

export const computeLargeFileHash = async (filepath: string): Promise<string> => {
  const hash = createHash('sha256');

  await pipeline(
    createReadStream(filepath),
    new Writable({
      write(chunk: Uint8Array, _enc, cb) {
        hash.update(chunk);
        cb();
      }
    })
  );

  return hash.digest('hex');
};
