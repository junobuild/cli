import {nonNullish} from '@dfinity/utils';
import type {
  DeployParams,
  DeployResult,
  DeployResultWithProposal,
  UploadFile,
  UploadFiles,
  UploadFileStorage
} from '@junobuild/cli-tools';
import {postDeploy as cliPostDeploy, preDeploy as cliPreDeploy} from '@junobuild/cli-tools';
import type {SatelliteConfig} from '@junobuild/config';
import {type Asset} from '@junobuild/core';
import {red} from 'kleur';
import {lstatSync} from 'node:fs';
import type {SatelliteParametersWithId} from '../../../types/satellite';
import {assertConfigAndLoadSatelliteContext} from '../../../utils/satellite.utils';
import {assertSatelliteMemorySize} from './deploy.assert.services';
import {listAssets} from './deploy.list.services';

export interface DeployFnParams<T = UploadFile> {
  deploy: {params: DeployParams; upload: T};
  satellite: SatelliteParametersWithId;
}

// TODO: refactor and naming?
export type UploadFileFnParams = UploadFileStorage & {satellite: SatelliteParametersWithId};
export type UploadFileFnParamsWithProposal = UploadFileFnParams & {proposalId: bigint};

export type UploadFilesFnParams = {
  files: UploadFileStorage[];
  satellite: SatelliteParametersWithId;
};
export type UploadFilesFnParamsWithProposal = UploadFilesFnParams & {proposalId: bigint};

type UploadFn<P extends UploadFileStorage, R extends DeployResult | DeployResultWithProposal> =
  | {
      deployFn: (params: DeployFnParams<(params: P) => Promise<void>>) => Promise<R>;
      uploadFn: (params: P & {satellite: SatelliteParametersWithId}) => Promise<void>;
      method: 'single';
    }
  | {
      deployFn: (params: DeployFnParams<(params: {files: P[]}) => Promise<void>>) => Promise<R>;
      uploadFn: (params: {files: P[], satellite: SatelliteParametersWithId}) => Promise<void>;
      method: 'grouped';
    };

type UploadFileStorageWithProposal = UploadFileStorage & {proposalId: bigint};

export const executeDeployWithProposal = async ({
  options,
  ...rest
}: {
  options: {deprecatedGzip?: string};
} & UploadFn<
  UploadFileStorageWithProposal,
  DeployResultWithProposal
>): Promise<DeployResultWithProposal> => {
  return await executeDeploy<UploadFileStorageWithProposal, DeployResultWithProposal>({
    options,
    ...rest
  });
};

export const executeDeployImmediate = async ({
  deployFn,
  uploadFn,
  options
}: {
  deployFn: (params: DeployFnParams) => Promise<DeployResult>;
  uploadFn: (params: UploadFileFnParams) => Promise<void>;
  options: {deprecatedGzip?: string};
}): Promise<DeployResult> => {
  return await executeDeploy<UploadFileStorage, DeployResult>({
    deployFn,
    uploadFn,
    options,
    method: 'single'
  });
};

const executeDeploy = async <
  P extends UploadFileStorage,
  R extends DeployResult | DeployResultWithProposal
>({
  deployFn,
  uploadFn,
  method,
  options
}: {
  options: {deprecatedGzip?: string};
} & UploadFn<P, R>): Promise<R> => {
  const assertMemory = async () => {
    await assertSatelliteMemorySize();
  };

  const {satellite, satelliteConfig: satelliteConfigRead} =
    await assertConfigAndLoadSatelliteContext();

  const gzip = satelliteConfigRead.gzip ?? options.deprecatedGzip;

  const satelliteConfig: SatelliteConfig = {
    ...satelliteConfigRead,
    ...(nonNullish(gzip) && {gzip})
  };

  const listExistingAssets = async ({startAfter}: {startAfter?: string}): Promise<Asset[]> =>
    await listAssets({
      startAfter,
      satellite
    });

  // TODO: really ugly
  let result: R;

  if (method === 'grouped') {
    const uploadFiles = async (params: {files: P[]}) => {
      const paramsWithSatellite: {files: P[]} & {
        satellite: SatelliteParametersWithId;
      } = {
        ...params,
        satellite
      };

      await uploadFn(paramsWithSatellite);
    };

    await cliPreDeploy({config: satelliteConfig});

    result = await deployFn({
      deploy: {
        params: {
          config: satelliteConfig,
          listAssets: listExistingAssets,
          assertSourceDirExists,
          assertMemory
        },
        upload: uploadFiles
      },
      satellite
    });
  } else {
    const uploadFile = async (params: P) => {
      const paramsWithSatellite: P & {satellite: SatelliteParametersWithId} = {
        ...params,
        satellite
      };

      await uploadFn(paramsWithSatellite);
    };

    await cliPreDeploy({config: satelliteConfig});

    result = await deployFn({
      deploy: {
        params: {
          config: satelliteConfig,
          listAssets: listExistingAssets,
          assertSourceDirExists,
          assertMemory
        },
        upload: uploadFile
      },
      satellite
    });
  }

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
