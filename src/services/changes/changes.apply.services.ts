import {hexStringToUint8Array} from '@dfinity/utils';
import {commitProposal} from '@junobuild/cdn';
import ora from 'ora';
import type {SatelliteParametersWithId} from '../../types/satellite';
import {readChangesIdAndHash} from '../../utils/changes.utils';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';
import {clearProposalStagedAssets} from './changes.clear.services';

export const applyChanges = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);

  const {proposalId, hash} = readChangesIdAndHash(args);

  await executeApplyChanges({satellite, proposalId, hash});

  await clearProposalStagedAssets({
    args,
    proposalId
  });
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
