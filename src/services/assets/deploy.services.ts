import {isEmptyString} from '@dfinity/utils';
import {hasArgs, nextArg} from '@junobuild/cli-tools';
import {yellow} from 'kleur';
import {compare} from 'semver';
import {type DeployOptions} from '../../types/deploy';
import {clearProposalStagedAssets} from '../changes/changes.clear.services';
import {getSatelliteVersion} from '../version.services';
import {deployImmediate} from './_deploy/deploy.individual.services';
import {deployWithProposal as executeDeployWithProposal} from './_deploy/deploy.with-proposal.services';

export const deploy = async (args?: string[]) => {
  // TODO: Remove fetching the version. We use it for backwards compatibility reasons.
  const result = await getSatelliteVersion();

  if (result.result === 'error') {
    return;
  }

  // TODO: There was an issue in Satellite that prevented gzipping HTML files.
  // This was fixed in version v0.1.1. However, for backward compatibility, we
  // fall back to not gzipping HTML files in earlier versions. While gzipping HTML
  // wouldn't harm usage, it might prevent crawlers from properly fetching content.
  const deprecatedGzip = compare(result.version, '0.1.1') < 0 ? '**/*.+(css|js|mjs)' : undefined;

  const {value: uploadBatchSize} = parseUploadBatchSize(args);

  const clearOption = hasArgs({args, options: ['--clear']});
  const immediate = hasArgs({args, options: ['-i', '--immediate']});

  if (immediate) {
    await deployImmediate({clearOption, deprecatedGzip, uploadBatchSize});
    return;
  }

  // TODO: Remove this check once backward compatibility is no longer needed.
  // Without falling back to `deploy --immediate`, we can't roll out GitHub Actions support
  // without requiring developers to either upgrade their Satellites or add the `--immediate` flag in CI.
  // To ease the release, we temporarily check the version.
  if (compare(result.version, '0.1.0') < 0) {
    console.log(
      `${yellow('[Warn]')} Your Satellite is outdated. Please upgrade to take full advantage of the new deployment flow.`
    );
    await deployImmediate({clearOption, deprecatedGzip, uploadBatchSize});
    return;
  }

  // TODO: use version for batch
  // const withBatch = compare(result.version, '0.1.2') >= 0;
  const withBatch = true;

  await deployWithProposal({args, clearOption, deprecatedGzip, uploadBatchSize, withBatch});
};

const deployWithProposal = async ({
  args,
  ...rest
}: {
  args?: string[];
  clearOption: boolean;
  withBatch: boolean;
} & DeployOptions) => {
  const noCommit = hasArgs({args, options: ['--no-apply']});

  const result = await executeDeployWithProposal({
    noCommit,
    ...rest
  });

  if (result.result !== 'deployed') {
    return;
  }

  const {proposalId} = result;

  await clearProposalStagedAssets({
    args,
    proposalId
  });
};

const parseUploadBatchSize = (args?: string[]): {valid: boolean; value?: number} => {
  const batchArg = nextArg({args, option: '--batch'});

  if (isEmptyString(batchArg)) {
    return {valid: true};
  }

  const batch = parseInt(batchArg);

  if (isNaN(batch)) {
    return {valid: false};
  }

  if (batch <= 0) {
    return {valid: false};
  }

  return {valid: true, value: batch};
};
