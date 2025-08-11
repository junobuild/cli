import {uploadAssetsWithProposal, uploadAssetWithProposal} from '@junobuild/cdn';
import {
  deploy as cliDeploy,
  deployWithProposal as cliDeployWithProposal,
  type DeployResult,
  type DeployResultWithProposal,
  hasArgs,
  type UploadFile,
  type UploadFileStorage,
  type UploadFilesWithProposal,
  type UploadFileWithProposal
} from '@junobuild/cli-tools';
import {uploadBlob} from '@junobuild/core';
import type {UploadAsset} from '@junobuild/storage';
import {yellow} from 'kleur';
import {compare} from 'semver';
import {clear} from './assets/clear.services';
import {
  type DeployFnParams,
  executeDeployImmediate,
  executeDeployWithProposal,
  type UploadFileFnParams,
  type UploadFileFnParamsWithProposal,
  type UploadFilesFnParamsWithProposal
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
  const deprecatedGzip = compare(result.version, '0.1.1') < 0 ? '**/*.+(css|js|mjs)' : undefined;

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

  // TODO: use version for grouped
  await deployWithProposal({args, clearOption, deprecatedGzip, grouped: true});
};

const deployWithProposal = async ({
  args,
  clearOption,
  grouped,
  deprecatedGzip
}: {
  args?: string[];
  clearOption: boolean;
  // TODO: rename
  grouped: boolean;
  deprecatedGzip: string | undefined;
}) => {
  const noCommit = hasArgs({args, options: ['--no-apply']});

  // TODO: upgly
  const mapFileToAssetForUpload = ({
    filename: storageFilename,
    fullPath: storagePath,
    data,
    collection,
    headers = [],
    encoding
  }: UploadFileStorage): UploadAsset => {
    // Similar as in Juno Core SDK
    // The IC certification does not currently support encoding
    const filename = decodeURI(storageFilename);
    const fullPath = storagePath ?? `/${collection}/${filename}`;

    return {
      filename,
      fullPath,
      data,
      collection,
      headers,
      encoding
    };
  };

  // TODO: much duplication
  const uploadSingleFile = async (): Promise<DeployResultWithProposal> => {
    const uploadFn = async ({satellite, proposalId, ...file}: UploadFileFnParamsWithProposal) => {
      await uploadAssetWithProposal({
        cdn: {satellite},
        proposalId,
        asset: mapFileToAssetForUpload(file)
      });
    };

    const deployFn = async ({
      deploy: {params, upload},
      satellite
    }: DeployFnParams<UploadFileWithProposal>): Promise<DeployResultWithProposal> =>
      await cliDeployWithProposal({
        deploy: {
          params: {
            ...params,
            includeAllFiles: clearOption
          },
          upload: {uploadFile: upload}
        },
        proposal: {
          clearAssets: clearOption,
          autoCommit: !noCommit,
          cdn: {
            satellite
          }
        }
      });

    return await executeDeployWithProposal({
      deployFn,
      uploadFn,
      options: {deprecatedGzip},
      method: 'single'
    });
  };

  const uploadGroupedFiles = async (): Promise<DeployResultWithProposal> => {
    const uploadFn = async ({files, satellite, proposalId}: UploadFilesFnParamsWithProposal) => {
      await uploadAssetsWithProposal({
        cdn: {satellite},
        proposalId,
        assets: files.map(mapFileToAssetForUpload)
      });
    };

    // TODO: basically just UploadFilesWithProposal different
    const deployFn = async ({
      deploy: {params, upload},
      satellite
    }: DeployFnParams<UploadFilesWithProposal>): Promise<DeployResultWithProposal> =>
      await cliDeployWithProposal({
        deploy: {
          params: {
            ...params,
            includeAllFiles: clearOption
          },
          upload: {uploadFiles: upload}
        },
        proposal: {
          clearAssets: clearOption,
          autoCommit: !noCommit,
          cdn: {
            satellite
          }
        }
      });

    return await executeDeployWithProposal({
      deployFn,
      uploadFn,
      method: 'grouped',
      options: {deprecatedGzip}
    });
  };

  const result = await (grouped ? uploadGroupedFiles() : uploadSingleFile());

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

  const deployFn = async ({
    deploy: {params, upload}
  }: DeployFnParams): Promise<DeployResult> =>
    await cliDeploy({
      params,
      upload: {uploadFile: upload}
    });

  const uploadFn = async ({
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
      data,
      collection,
      headers,
      encoding
    });
  };

  await executeDeployImmediate({
    deployFn,
    uploadFn,
    options: {deprecatedGzip}
  });
};
