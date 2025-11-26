import {hexStringToUint8Array} from '@dfinity/utils';
import {
  type RejectProposalParams,
  type RejectProposalProgress,
  RejectProposalProgressStep,
  executeRejectProposal
} from '@junobuild/cdn';
import {hasArgs} from '@junobuild/cli-tools';
import ora from 'ora';
import type {SatelliteParametersWithId} from '../../types/satellite';
import {readChangesIdAndHash} from '../../utils/changes.utils';
import {assertConfigAndLoadSatelliteContext} from '../../utils/juno.config.utils';

export const rejectChanges = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext();

  const {proposalId, hash} = readChangesIdAndHash(args);

  const keepAssets = hasArgs({args, options: ['-k', '--keep-staged']});

  await executeRejectChanges({satellite, proposalId, hash, clearProposalAssets: !keepAssets});
};

const executeRejectChanges = async ({
  satellite,
  proposalId,
  hash,
  ...rest
}: {
  proposalId: bigint;
  hash: string;
  satellite: SatelliteParametersWithId;
} & Pick<RejectProposalParams, 'clearProposalAssets'>) => {
  const spinner = ora().start();

  const onProgress = ({step}: RejectProposalProgress) => {
    switch (step) {
      case RejectProposalProgressStep.RejectingProposal:
        spinner.text = 'Rejecting...';
        break;
      case RejectProposalProgressStep.ClearingProposalAssets:
        spinner.text = 'Clearing staged assets...';
        break;
      case RejectProposalProgressStep.PostReject:
        spinner.text = 'Reloading...';
        break;
    }
  };

  try {
    await executeRejectProposal({
      cdn: {
        satellite
      },
      proposal: {
        proposal_id: proposalId,
        sha256: hexStringToUint8Array(hash)
      },
      onProgress,
      ...rest
    });

    spinner.stop();

    console.log(`🚫 Change ID ${proposalId} rejected.`);
  } catch (err: unknown) {
    spinner.stop();

    throw err;
  }
};
