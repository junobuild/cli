import {hexStringToUint8Array} from '@dfinity/utils';
import {
  ApplyProposalProgressStep,
  executeApplyProposal,
  type ApplyProposalParams,
  type ApplyProposalProgress
} from '@junobuild/cdn';
import {hasArgs} from '@junobuild/cli-tools';
import ora from 'ora';
import type {SatelliteParametersWithId} from '../../types/satellite';
import {readChangesIdAndHash} from '../../utils/changes.utils';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';

export const applyChanges = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext();

  const {proposalId, hash} = readChangesIdAndHash(args);

  const keepAssets = hasArgs({args, options: ['-k', '--keep-staged']});
  const takeSnapshot = hasArgs({args, options: ['--snapshot']});

  await executeApplyChanges({
    satellite,
    proposalId,
    hash,
    clearProposalAssets: !keepAssets,
    takeSnapshot
  });
};

const executeApplyChanges = async ({
  satellite,
  proposalId,
  hash,
  ...rest
}: {
  proposalId: bigint;
  hash: string;
  satellite: SatelliteParametersWithId;
} & Pick<ApplyProposalParams, 'clearProposalAssets' | 'takeSnapshot'>) => {
  const spinner = ora().start();

  const onProgress = ({step}: ApplyProposalProgress) => {
    switch (step) {
      case ApplyProposalProgressStep.TakingSnapshot:
        spinner.text = 'Creating a snapshot...';
        break;
      case ApplyProposalProgressStep.CommittingProposal:
        spinner.text = 'Applying update...';
        break;
      case ApplyProposalProgressStep.ClearingProposalAssets:
        spinner.text = 'Clearing staged assets...';
        break;
      case ApplyProposalProgressStep.PostApply:
        spinner.text = 'Reloading...';
        break;
    }
  };

  try {
    await executeApplyProposal({
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

    console.log(`🎯 Change ID ${proposalId} applied.`);
  } catch (err: unknown) {
    spinner.stop();

    throw err;
  }
};
