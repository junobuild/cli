import {uploadAssetsWithProposal, uploadAssetWithProposal} from '@junobuild/cdn';
import type {UploadIndividually, UploadWithBatch,
  deployWithProposal as cliDeployWithProposal,
  type DeployParams,
  type DeployResultWithProposal,
  type UploadFileStorage,
  type UploadFilesWithProposal,
  type UploadFileWithProposal
} from '@junobuild/cli-tools';
import type {UploadAsset} from '@junobuild/storage';
import {type SatelliteParametersWithId} from '../../types/satellite';
import {
  type DeployFnParams,
  executeDeployWithProposal,
  type UploadFileFnParamsWithProposal,
  type UploadFilesFnParamsWithProposal
} from '../assets/deploy/deploy.execute.services';

interface DeployWithProposalParams {
  clearOption: boolean;
  deprecatedGzip: string | undefined;
  noCommit: boolean;
}

export const deployWithProposal = async ({
  withBatch,
  ...rest
}: {
  withBatch: boolean;
} & DeployWithProposalParams) => {
  return await (withBatch ? uploadFilesWithBatch(rest) : uploadFilesIndividually(rest));
};

const uploadFilesIndividually = async ({
  deprecatedGzip,
  ...cliParams
}: DeployWithProposalParams): Promise<DeployResultWithProposal> => {
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
    await deployWithUpload({
      deploy: {params, upload: {uploadFile: upload}},
      satellite,
      cliParams
    });

  return await executeDeployWithProposal({
    deployFn,
    uploadFn,
    options: {deprecatedGzip},
    method: 'single'
  });
};

const uploadFilesWithBatch = async ({
  deprecatedGzip,
  ...cliParams
}: DeployWithProposalParams): Promise<DeployResultWithProposal> => {
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
    await deployWithUpload({
      deploy: {params, upload: {uploadFiles: upload}},
      satellite,
      cliParams
    });

  return await executeDeployWithProposal({
    deployFn,
    uploadFn,
    method: 'grouped',
    options: {deprecatedGzip}
  });
};

const deployWithUpload = async ({
  deploy: {params, upload},
  satellite,
  cliParams: {clearOption, noCommit}
}: {
  deploy: {
    params: DeployParams;
    upload: UploadIndividually<UploadFileWithProposal> | UploadWithBatch<UploadFilesWithProposal>;
  };
  satellite: SatelliteParametersWithId;
  cliParams: Omit<DeployWithProposalParams, 'deprecatedGzip'>;
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
