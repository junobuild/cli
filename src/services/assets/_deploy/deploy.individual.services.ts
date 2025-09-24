import type {DeployResult} from '@junobuild/cli-tools';
import {deploy as cliDeploy} from '@junobuild/cli-tools';
import {uploadBlob} from '@junobuild/core';
import {
  type DeployFnParams,
  type DeployOptions,
  type UploadFileFnParams
} from '../../../types/deploy';
import {executeClear} from '../clear.services';
import {executeDeployImmediate} from './deploy.execute.services';

export const deployImmediate = async ({
  clearOption,
  ...restOptions
}: {
  clearOption: boolean;
} & DeployOptions) => {
  if (clearOption) {
    await executeClear();
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
    options: restOptions
  });
};
