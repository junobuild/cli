import type {DeployParams, DeployResult, UploadFileStorage} from '@junobuild/cli-tools';
import {postDeploy as cliPostDeploy, preDeploy as cliPreDeploy} from '@junobuild/cli-tools';
import {type Asset, uploadBlob} from '@junobuild/core';
import {red} from 'kleur';
import {lstatSync} from 'node:fs';
import {readJunoConfig} from '../../configs/juno.config';
import {type SatelliteParametersWithId} from '../../types/satellite';
import {configEnv} from '../../utils/config.utils';
import {satelliteParameters} from '../../utils/satellite.utils';
import {assertSatelliteMemorySize} from './deploy.assert.services';
import {listAssets} from './deploy.assets.services';

export interface DeployFnParams {
  deploy: DeployParams;
  satellite: SatelliteParametersWithId;
}

export const executeDeploy = async ({
  args,
  deployFn
}: {
  args?: string[];
  deployFn: (params: DeployFnParams) => Promise<DeployResult>;
}) => {
  const env = configEnv(args);
  const {satellite: satelliteConfig} = await readJunoConfig(env);

  const listExistingAssets = async ({startAfter}: {startAfter?: string}): Promise<Asset[]> =>
    await listAssets({
      startAfter,
      env: {
        env,
        satellite: satelliteConfig
      }
    });

  const assertMemory = async () => {
    await assertSatelliteMemorySize(args);
  };

  const satellite = await satelliteParameters({satellite: satelliteConfig, env});

  const uploadFile = async ({
    filename,
    fullPath,
    data,
    collection,
    headers,
    encoding
  }: UploadFileStorage) => {
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

  await cliPreDeploy({config: satelliteConfig});

  const {result} = await deployFn({
    deploy: {
      config: satelliteConfig,
      listAssets: listExistingAssets,
      assertSourceDirExists,
      assertMemory,
      uploadFile
    },
    satellite
  });

  if (result === 'skipped') {
    process.exit(0);
  }

  await cliPostDeploy({config: satelliteConfig});
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
