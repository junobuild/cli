import {nonNullish} from '@dfinity/utils';
import type {
  DeployParams,
  DeployResult,
  DeployResultWithProposal,
  UploadFileStorage
} from '@junobuild/cli-tools';
import {postDeploy as cliPostDeploy, preDeploy as cliPreDeploy} from '@junobuild/cli-tools';
import type {SatelliteConfig} from '@junobuild/config';
import {type Asset} from '@junobuild/core';
import {red} from 'kleur';
import {lstatSync} from 'node:fs';
import {
  type DeployFnParams,
  type UploadFileFnParams,
  type UploadFn,
  type UploadInput,
  type UploadParams
} from '../../../types/deploy';
import type {SatelliteParametersWithId} from '../../../types/satellite';
import {assertConfigAndLoadSatelliteContext} from '../../../utils/satellite.utils';
import {assertSatelliteMemorySize} from '../../assert.services';
import {listAssets} from './deploy.list.services';

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
    method: 'individual'
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

  if (method === 'batch') {
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
