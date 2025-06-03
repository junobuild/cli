import {fromNullable, hexStringToUint8Array, isNullish} from '@dfinity/utils';
import {commitProposal, getProposal, Proposal} from '@junobuild/cdn';
import {red} from 'kleur';
import ora from 'ora';
import type {SatelliteParametersWithId} from '../../types/satellite';
import {readChangesIdAndHash} from '../../utils/changes.utils';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';
import {clearProposalStagedAssets} from './changes.clear.services';

export const applyChanges = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);

  const result = await init({args, satellite});

  if (result.result === "error") {
    return;
  }

  const {proposalId, proposal, hash} = result;

  await executeApplyChanges({satellite, proposalId, hash});

  await clearProposalStagedAssets({
    args,
    proposalId
  });

  switch (Object.keys(proposal.proposal_type)[0]) {
    case 'SegmentsDeployment':
      // TODO
    default:
      return;
  }
};

const init = async ({
  args,
  satellite
}: {
  args?: string[];
  satellite: SatelliteParametersWithId;
}): Promise<
  {result: 'success'; proposalId: bigint; hash: string; proposal: Proposal} | {result: 'error'}
> => {
  const spinner = ora('Loading...').start();

  try {
    const {proposalId, ...rest} = readChangesIdAndHash(args);

    const result = await getProposal({
      cdn: {
        satellite
      },
      proposal_id: proposalId
    });

    const proposal = fromNullable(result);

    if (isNullish(proposal)) {
      console.log(red(`Unknown proposal ID ${proposalId}.`));
      return {result: 'error'};
    }

    return {
      result: 'success',
      ...rest,
      proposal,
      proposalId
    };
  } catch (err: unknown) {
    spinner.stop();

    throw err;
  }
};

const executeApplyChanges = async ({
  satellite,
  proposalId,
  hash
}: {
  proposalId: bigint;
  hash: string;
  satellite: SatelliteParametersWithId;
}) => {
  const spinner = ora('Applying...').start();

  try {
    await commitProposal({
      cdn: {
        satellite
      },
      proposal: {
        proposal_id: proposalId,
        sha256: hexStringToUint8Array(hash)
      }
    });

    spinner.stop();

    console.log(`🎯 Change ID ${proposalId} applied.`);
  } catch (err: unknown) {
    spinner.stop();

    throw err;
  }
};
