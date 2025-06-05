import type {
  DeployParams,
  DeployResult,
  DeployResultWithProposal,
  UploadFile,
  UploadFileStorage,
  UploadFileStorageWithProposal,
  UploadFileWithProposal
} from '@junobuild/cli-tools';
import {postDeploy as cliPostDeploy, preDeploy as cliPreDeploy} from '@junobuild/cli-tools';
import {type Asset} from '@junobuild/core';
import {red} from 'kleur';
import {lstatSync} from 'node:fs';
import type {SatelliteParametersWithId} from '../../../types/satellite';
import {assertConfigAndLoadSatelliteContext} from '../../../utils/satellite.utils';
import {assertSatelliteMemorySize} from './deploy.assert.services';
import {listAssets} from './deploy.list.services';

export interface DeployFnParams<T = UploadFile> {
  deploy: DeployParams<T>;
  satellite: SatelliteParametersWithId;
}

export type UploadFileFnParams = UploadFileStorage & {satellite: SatelliteParametersWithId};
export type UploadFileFnParamsWithProposal = UploadFileFnParams & {proposalId: bigint};

export const executeDeployWithProposal = async ({
  deployFn,
  uploadFileFn
}: {
  args?: string[];
  deployFn: (params: DeployFnParams<UploadFileWithProposal>) => Promise<DeployResultWithProposal>;
  uploadFileFn: (params: UploadFileFnParamsWithProposal) => Promise<void>;
}): Promise<DeployResultWithProposal> => {
  return await executeDeploy<UploadFileStorageWithProposal, DeployResultWithProposal>({
    deployFn,
    uploadFileFn
  });
};

export const executeDeployImmediate = async ({
  deployFn,
  uploadFileFn
}: {
  args?: string[];
  deployFn: (params: DeployFnParams) => Promise<DeployResult>;
  uploadFileFn: (params: UploadFileFnParams) => Promise<void>;
}): Promise<DeployResult> => {
  return await executeDeploy<UploadFileStorage, DeployResult>({
    deployFn,
    uploadFileFn
  });
};

const executeDeploy = async <
  P extends UploadFileStorage,
  R extends DeployResult | DeployResultWithProposal
>({
  deployFn,
  uploadFileFn
}: {
  deployFn: (params: DeployFnParams<(params: P) => Promise<void>>) => Promise<R>;
  uploadFileFn: (params: P & {satellite: SatelliteParametersWithId}) => Promise<void>;
}): Promise<R> => {
  const assertMemory = async () => {
    await assertSatelliteMemorySize();
  };

  const {satellite, satelliteConfig} = await assertConfigAndLoadSatelliteContext();

  const listExistingAssets = async ({startAfter}: {startAfter?: string}): Promise<Asset[]> =>
    await listAssets({
      startAfter,
      satellite
    });

  const uploadFile = async (params: P) => {
    const paramsWithSatellite: P & {satellite: SatelliteParametersWithId} = {
      ...params,
      satellite
    };

    await uploadFileFn(paramsWithSatellite);
  };

  await cliPreDeploy({config: satelliteConfig});

  const result = await deployFn({
    deploy: {
      config: satelliteConfig,
      listAssets: listExistingAssets,
      assertSourceDirExists,
      assertMemory,
      uploadFile
    },
    satellite
  });

  if (result.result === 'skipped') {
    process.exit(0);
  }

  await cliPostDeploy({config: satelliteConfig});

  return result;
};

const assertSourceDirExists = (source: string) => {
  try {
    lstatSync(source);
  } catch (_err: unknown) {
    console.log(
      `${red(
        'Cannot proceed deployment.'
      )}\nAre you sure the folder containing your built app (the "source" tag in the configuration file for Juno) files is correctly configured, or have you built your app?`
    );
    process.exit(1);
  }
};
