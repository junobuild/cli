import {hexStringToUint8Array} from '@dfinity/utils';
import {rejectProposal} from '@junobuild/cdn';
import ora from 'ora';
import type {SatelliteParametersWithId} from '../../types/satellite';
import {readChangesIdAndHash} from '../../utils/changes.utils';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';
import {clearProposalStagedAssets} from './changes.clear.services';

export const rejectChanges = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);

  const {proposalId, hash} = readChangesIdAndHash(args);

  await executeRejectChanges({satellite, proposalId, hash});

  await clearProposalStagedAssets({
    args,
    proposalId
  });
};

const executeRejectChanges = async ({
  satellite,
  proposalId,
  hash
}: {
  proposalId: bigint;
  hash: string;
  satellite: SatelliteParametersWithId;
}) => {
  const spinner = ora('Rejecting...').start();

  try {
    await rejectProposal({
      cdn: {
        satellite
      },
      proposal: {
        proposal_id: proposalId,
        sha256: hexStringToUint8Array(hash)
      }
    });

    spinner.stop();

    console.log(`\n🚫 Change ID ${proposalId} rejected.`);
  } catch (err: unknown) {
    spinner.stop();

    throw err;
  }
};
