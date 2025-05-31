import {hexStringToUint8Array} from '@dfinity/utils';
import {rejectProposal} from '@junobuild/cdn';
import ora from 'ora';
import {readChangesIdAndHash} from '../../utils/changes.utils';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';

export const rejectChanges = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);

  const {proposalId, hash} = readChangesIdAndHash(args);

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

    console.log(`🚫 Change ID ${proposalId} rejected.`);
  } finally {
    spinner.stop();
  }
};
