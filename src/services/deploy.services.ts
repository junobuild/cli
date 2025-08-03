import {uploadAssetWithProposal} from '@junobuild/cdn';
import {
  deploy as cliDeploy,
  deployWithProposal as cliDeployWithProposal,
  type DeployResult,
  type DeployResultWithProposal,
  hasArgs,
  type UploadFileWithProposal
} from '@junobuild/cli-tools';
import {uploadBlob} from '@junobuild/core';
import {yellow} from 'kleur';
import {compare} from 'semver';
import {clear} from './assets/clear.services';
import {
  type DeployFnParams,
  executeDeployImmediate,
  executeDeployWithProposal,
  type UploadFileFnParams,
  type UploadFileFnParamsWithProposal
} from './assets/deploy/deploy.execute.services';
import {clearProposalStagedAssets} from './changes/changes.clear.services';
import {getSatelliteVersion} from './version.services';

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
  const deprecatedGzip = compare(result.version, '0.1.0') < 0 ? '**/*.+(css|js|mjs)' : undefined;

  const clearOption = hasArgs({args, options: ['--clear']});
  const immediate = hasArgs({args, options: ['-i', '--immediate']});

  if (immediate) {
    await deployImmediate({clearOption, deprecatedGzip});
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
    await deployImmediate({clearOption, deprecatedGzip});
    return;
  }

  await deployWithProposal({args, clearOption, deprecatedGzip});
};

const deployWithProposal = async ({
  args,
  clearOption,
  deprecatedGzip
}: {
  args?: string[];
  clearOption: boolean;
  deprecatedGzip: string | undefined;
}) => {
  const noCommit = hasArgs({args, options: ['--no-apply']});

  const deployFn = async ({
    deploy,
    satellite
  }: DeployFnParams<UploadFileWithProposal>): Promise<DeployResultWithProposal> =>
    await cliDeployWithProposal({
      deploy: {
        ...deploy,
        includeAllFiles: clearOption
      },
      proposal: {
        clearAssets: clearOption,
        autoCommit: !noCommit,
        cdn: {
          satellite
        }
      }
    });

  const uploadFileFn = async ({
    filename: storageFilename,
    fullPath: storagePath,
    data,
    collection,
    headers = [],
    encoding,
    satellite,
    proposalId
  }: UploadFileFnParamsWithProposal) => {
    // Similar as in Juno Core SDK
    // The IC certification does not currently support encoding
    const filename = decodeURI(storageFilename);
    const fullPath = storagePath ?? `/${collection}/${filename}`;

    await uploadAssetWithProposal({
      cdn: {satellite},
      proposalId,
      asset: {
        filename,
        fullPath,
        // @ts-expect-error type incompatibility NodeJS vs bundle
        data,
        collection,
        headers,
        encoding
      }
    });
  };

  const result = await executeDeployWithProposal({
    deployFn,
    uploadFileFn,
    options: {deprecatedGzip}
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

const deployImmediate = async ({
  clearOption,
  deprecatedGzip
}: {
  clearOption: boolean;
  deprecatedGzip: string | undefined;
}) => {
  if (clearOption) {
    await clear();
  }

  const deployFn = async ({deploy}: DeployFnParams): Promise<DeployResult> =>
    await cliDeploy(deploy);

  const uploadFileFn = async ({
    filename,
    fullPath,
    data,
    collection,
    headers,
    encoding,
    satellite
  }: UploadFileFnParams) => {
    await uploadBlob({
      satellite,
      filename,
      fullPath,
      // @ts-expect-error type incompatibility NodeJS vs bundle
      data,
      collection,
      headers,
      encoding
    });
  };

  await executeDeployImmediate({
    deployFn,
    uploadFileFn,
    options: {deprecatedGzip}
  });
};
