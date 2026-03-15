import {isEmptyString} from '@dfinity/utils';
import {nextArg} from '@junobuild/cli-tools';

export const parseBatchSize = (args?: string[]): {valid: boolean; value?: number} => {
  const batchArg = nextArg({args, option: '--batch'});

  if (isEmptyString(batchArg)) {
    return {valid: true};
  }

  const batch = parseInt(batchArg);

  if (isNaN(batch)) {
    return {valid: false};
  }

  if (batch <= 0) {
    return {valid: false};
  }

  return {valid: true, value: batch};
};
