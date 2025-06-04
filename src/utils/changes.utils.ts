import {assertNonNullish} from '@dfinity/utils';
import {nextArg} from '@junobuild/cli-tools';

export const readChangesIdAndHash = (args?: string[]): {proposalId: bigint; hash: string} => {
  const id = nextArg({args, option: '-i'}) ?? nextArg({args, option: '--id'});

  assertNonNullish(id, 'An id must be provided');

  const toBigInt = (): bigint => {
    try {
      return BigInt(id);
    } catch (_err: unknown) {
      console.error('The id must be a valid number.');
      process.exit(1);
    }
  };

  const proposalId = toBigInt();

  const hash = nextArg({args, option: '-a'}) ?? nextArg({args, option: '--hash'});

  assertNonNullish(hash, 'A hash must be provided');

  return {
    proposalId,
    hash
  };
};
