import {deleteProposalAssets} from '@junobuild/cdn';
import {hasArgs} from '@junobuild/cli-tools';
import {green} from 'kleur';
import ora from 'ora';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';

export const clearProposalStagedAssets = async ({
  args,
  proposalId
}: {
  args?: string[];
  proposalId: bigint;
}): Promise<{result: 'skipped' | 'deleted' | 'error'}> => {
  const keepAssets = hasArgs({args, options: ['-k', '--keep-staged']});

  if (keepAssets) {
    return {result: 'skipped'};
  }

  console.log('');

  const spinner = ora('Deleting staged assets...').start();

  try {
    const {satellite} = await assertConfigAndLoadSatelliteContext(args);

    await deleteProposalAssets({
      cdn: {satellite},
      proposalIds: [proposalId]
    });

    spinner.stop();

    console.log(`${green('✔')} Staged assets deleted.`);

    return {result: 'deleted'};
  } catch (err: unknown) {
    spinner.stop();

    return {result: 'error'};
  }
};
