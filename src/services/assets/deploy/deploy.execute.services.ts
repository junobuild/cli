import {nonNullish} from '@dfinity/utils';
import type {
  DeployParams,
  DeployResult,
  DeployResultWithProposal,
  UploadFile,
  UploadFileStorage
} from '@junobuild/cli-tools';
import {postDeploy as cliPostDeploy, preDeploy as cliPreDeploy} from '@junobuild/cli-tools';
import type {SatelliteConfig} from '@junobuild/config';
import {type Asset} from '@junobuild/core';
import {type OnUploadProgress} from '@junobuild/storage';
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
export type UploadFileFnParamsWithProposal = UploadFileFnParams & {
  proposalId: bigint;
} & OnUploadProgress;

export type UploadFilesFnParams = {
  files: UploadFileStorage[];
  satellite: SatelliteParametersWithId;
} & OnUploadProgress;
export type UploadFilesFnParamsWithProposal = UploadFilesFnParams & {proposalId: bigint};

type UploadInput<T, R> = [R] extends [DeployResultWithProposal] ? T & {proposalId: bigint} : T;

type UploadParams<T, R> = UploadInput<T, R> & {
  satellite: SatelliteParametersWithId;
};

type UploadFn<P extends UploadFileStorage, R extends DeployResult | DeployResultWithProposal> =
  | {
      method: 'single';
      deployFn: (
        params: DeployFnParams<(params: UploadInput<P, R>) => Promise<void>>
      ) => Promise<R>;
      uploadFn: (params: UploadParams<P, R>) => Promise<void>;
    }
  | {
      method: 'grouped';
      deployFn: (
        params: DeployFnParams<(params: UploadInput<{files: P[]}, R>) => Promise<void>>
      ) => Promise<R>;
      uploadFn: (params: UploadParams<{files: P[]}, R>) => Promise<void>;
    };

export const executeDeployWithProposal = async ({
  options,
  ...rest
}: {
  options: {deprecatedGzip?: string};
} & UploadFn<UploadFileStorage, DeployResultWithProposal>): Promise<DeployResultWithProposal> => {
  return await executeDeploy<UploadFileStorage, DeployResultWithProposal>({
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
  options,
  ...rest
}: {
  options: {deprecatedGzip?: string};
} & UploadFn<P, R>): Promise<R> => {
  const {satellite, satelliteConfig: satelliteConfigRead} =
    await assertConfigAndLoadSatelliteContext();

  const gzip = satelliteConfigRead.gzip ?? options.deprecatedGzip;

  const satelliteConfig: SatelliteConfig = {
    ...satelliteConfigRead,
    ...(nonNullish(gzip) && {gzip})
  };

  await cliPreDeploy({config: satelliteConfig});

  const result = await deployWithMethod<P, R>({
    ...rest,
    satellite,
    satelliteConfig
  });

  if (result.result === 'skipped') {
    process.exit(0);
  }

  await cliPostDeploy({config: satelliteConfig});

  return result;
};

const deployWithMethod = async <
  P extends UploadFileStorage,
  R extends DeployResult | DeployResultWithProposal
>({
  deployFn,
  uploadFn,
  method,
  satellite,
  satelliteConfig
}: {
  satellite: SatelliteParametersWithId;
  satelliteConfig: SatelliteConfig;
} & UploadFn<P, R>): Promise<R> => {
  const assertMemory = async () => {
    await assertSatelliteMemorySize();
  };

  const listExistingAssets = async ({startAfter}: {startAfter?: string}): Promise<Asset[]> =>
    await listAssets({
      startAfter,
      satellite
    });

  const deployParams: DeployParams = {
    config: satelliteConfig,
    listAssets: listExistingAssets,
    assertSourceDirExists,
    assertMemory
  };

  if (method === 'grouped') {
    const uploadFiles = async (params: UploadInput<{files: P[]}, R>) => {
      const paramsWithSatellite: UploadParams<{files: P[]}, R> = {
        ...params,
        satellite
      };
      await uploadFn(paramsWithSatellite);
    };

    return await deployFn({
      deploy: {
        params: deployParams,
        upload: uploadFiles
      },
      satellite
    });
  }

  const uploadFile = async (params: UploadInput<P, R>) => {
    const paramsWithSatellite: UploadParams<P, R> = {
      ...params,
      satellite
    };
    await uploadFn(paramsWithSatellite);
  };

  return await deployFn({
    deploy: {
      params: deployParams,
      upload: uploadFile
    },
    satellite
  });
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
