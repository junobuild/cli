import {jsonReplacer} from '@dfinity/utils';
import {createHash} from 'node:crypto';

const sortReplacer = (_key: string, value: unknown): unknown =>
  value instanceof Object && !(value instanceof Array)
    ? Object.keys(value)
        .sort()
        .reduce(
          (sorted, key) => ({
            ...sorted,
            [key]: value[key]
          }),
          {}
        )
    : value;

const replacers = (key: string, value: unknown): unknown =>
  [sortReplacer, jsonReplacer].reduce((val, replacer) => replacer(key, val), value);

export const objHash = (obj: unknown): string =>
  createHash('sha256').update(JSON.stringify(obj, replacers)).digest('hex');
