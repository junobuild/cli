import {hexStringToUint8Array} from '@dfinity/utils';
import {commitProposal} from '@junobuild/cdn';
import ora from 'ora';
import {readChangesIdAndHash} from '../../utils/changes.utils';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';

export const applyChanges = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);

  const {proposalId, hash} = readChangesIdAndHash(args);

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

    console.log(`\n🎯 Change ID ${proposalId} applied.`);
  } finally {
    spinner.stop();
  }
};
