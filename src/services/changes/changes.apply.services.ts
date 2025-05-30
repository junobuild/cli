import {assertNonNullish} from '@dfinity/utils';
import {hexStringToUint8Array} from '@dfinity/utils/dist/types/utils/arrays.utils';
import {commitProposal} from '@junobuild/cdn';
import {nextArg} from '@junobuild/cli-tools';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';

export const applyChanges = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);

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

  const hash = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--hash'});

  assertNonNullish(hash, 'A hash must be provided');

  await commitProposal({
    cdn: {
      satellite
    },
    proposal: {
      proposal_id: proposalId,
      sha256: hexStringToUint8Array(hash)
    }
  });

  console.log(`🎯 Change ${proposalId} applied.`);
};
