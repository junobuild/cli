import {jsonReplacer} from '@dfinity/utils';
import {createHash} from 'node:crypto';

export const objHash = (obj: unknown): string =>
  createHash('sha256').update(JSON.stringify(obj, jsonReplacer)).digest('hex');
