import {uploadAssetsWithProposal, uploadAssetWithProposal} from '@junobuild/cdn';
import type {UploadIndividually, UploadWithBatch} from '@junobuild/cli-tools';
import {
  deploy as cliDeploy,
  deployWithProposal as cliDeployWithProposal,
  type DeployParams,
  type DeployResult,
  type DeployResultWithProposal,
  hasArgs,
  type UploadFileStorage,
  type UploadFilesWithProposal,
  type UploadFileWithProposal
} from '@junobuild/cli-tools';
import {uploadBlob} from '@junobuild/core';
import type {UploadAsset} from '@junobuild/storage';
import {yellow} from 'kleur';
import {compare} from 'semver';
import type {SatelliteParametersWithId} from '../types/satellite';
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
  // const withBatch = compare(result.version, '0.1.2') >= 0;
  const withBatch = true;

  await deployWithProposal({args, clearOption, deprecatedGzip, withBatch});
};

const deployWithProposal = async ({
  args,
  clearOption,
  withBatch,
  deprecatedGzip
}: {
  args?: string[];
  clearOption: boolean;
  withBatch: boolean;
  deprecatedGzip: string | undefined;
}) => {
  const noCommit = hasArgs({args, options: ['--no-apply']});

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

  const deployWithProposal = async ({
    deploy: {params, upload},
    satellite
  }: {
    deploy: {
      params: DeployParams;
      upload: UploadIndividually<UploadFileWithProposal> | UploadWithBatch<UploadFilesWithProposal>;
    };
    satellite: SatelliteParametersWithId;
  }): Promise<DeployResultWithProposal> =>
    await cliDeployWithProposal({
      deploy: {
        params: {
          ...params,
          includeAllFiles: clearOption
        },
        upload
      },
      proposal: {
        clearAssets: clearOption,
        autoCommit: !noCommit,
        cdn: {
          satellite
        }
      }
    });

  const uploadFilesIndividually = async (): Promise<DeployResultWithProposal> => {
    const uploadFn = async ({
      satellite,
      proposalId,
      progress,
      ...file
    }: UploadFileFnParamsWithProposal) => {
      await uploadAssetWithProposal({
        cdn: {satellite},
        proposalId,
        progress,
        asset: mapFileToAssetForUpload(file)
      });
    };

    const deployFn = async ({
      deploy: {params, upload},
      satellite
    }: DeployFnParams<UploadFileWithProposal>): Promise<DeployResultWithProposal> =>
      await deployWithProposal({
        deploy: {params, upload: {uploadFile: upload}},
        satellite
      });

    return await executeDeployWithProposal({
      deployFn,
      uploadFn,
      options: {deprecatedGzip},
      method: 'single'
    });
  };

  const uploadFilesWithBatch = async (): Promise<DeployResultWithProposal> => {
    const uploadFn = async ({files, satellite, ...rest}: UploadFilesFnParamsWithProposal) => {
      await uploadAssetsWithProposal({
        cdn: {satellite},
        assets: files.map(mapFileToAssetForUpload),
        ...rest
      });
    };

    const deployFn = async ({
      deploy: {params, upload},
      satellite
    }: DeployFnParams<UploadFilesWithProposal>): Promise<DeployResultWithProposal> =>
      await deployWithProposal({
        deploy: {params, upload: {uploadFiles: upload}},
        satellite
      });

    return await executeDeployWithProposal({
      deployFn,
      uploadFn,
      method: 'grouped',
      options: {deprecatedGzip}
    });
  };

  const result = await (withBatch ? uploadFilesWithBatch() : uploadFilesIndividually());

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

  const deployFn = async ({deploy: {params, upload}}: DeployFnParams): Promise<DeployResult> =>
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
