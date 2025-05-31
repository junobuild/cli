import {hexStringToUint8Array} from '@dfinity/utils';
import {rejectProposal} from '@junobuild/cdn';
import {readChangesIdAndHash} from '../../utils/changes.utils';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';

export const rejectChanges = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);

  const {proposalId, hash} = readChangesIdAndHash(args);

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
};
