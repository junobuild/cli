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
import {junoConfigExist} from '../configs/juno.config';
import {clear} from '../services/assets/clear.services';
import {
  type DeployFnParams,
  executeDeployImmediate,
  executeDeployWithProposal,
  type UploadFileFnParams,
  type UploadFileFnParamsWithProposal
} from '../services/assets/deploy/deploy.execute.services';
import {clearProposalStagedAssets} from '../services/changes/changes.clear.services';
import {links} from '../services/links.services';
import {init} from './init';

export const deploy = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    await init();
  }

  const clearOption = hasArgs({args, options: ['-c', '--clear']});
  const immediate = hasArgs({args, options: ['-i', '--immediate']});

  if (immediate) {
    await deployImmediate({clearOption});
    return;
  }

  await deployWithProposal({args, clearOption});
};

const deployWithProposal = async ({args, clearOption}: {args?: string[]; clearOption: boolean}) => {
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
    uploadFileFn
  });

  if (result.result !== 'deployed') {
    return;
  }

  const {proposalId} = result;

  await clearProposalStagedAssets({
    args,
    proposalId
  });

  await links();
};

const deployImmediate = async ({clearOption}: {clearOption: boolean}) => {
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
    uploadFileFn
  });

  await links();
};
