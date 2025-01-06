import type {UploadFileStorage} from '@junobuild/cli-tools';
import {
  deploy as cliDeploy,
  postDeploy as cliPostDeploy,
  preDeploy as cliPreDeploy,
  hasArgs
} from '@junobuild/cli-tools';
import {uploadBlob, type Asset} from '@junobuild/core';
import {red} from 'kleur';
import {lstatSync} from 'node:fs';
import {junoConfigExist, readJunoConfig} from '../configs/juno.config';
import {clear} from '../services/clear.services';
import {assertSatelliteMemorySize, listAssets} from '../services/deploy.services';
import {links} from '../services/links.services';
import {configEnv} from '../utils/config.utils';
import {satelliteParameters} from '../utils/satellite.utils';
import {init} from './init';

export const deploy = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    await init();
  }

  if (hasArgs({args, options: ['-c', '--clear']})) {
    await clear(args);
  }

  await executeDeploy(args);

  await links(args);
};

const executeDeploy = async (args?: string[]) => {
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

  await cliDeploy({
    config: satelliteConfig,
    listAssets: listExistingAssets,
    assertSourceDirExists,
    assertMemory,
    uploadFile
  });

  await cliPostDeploy({config: satelliteConfig});
};

const assertSourceDirExists = (source: string) => {
  try {
    lstatSync(source);
  } catch (err: unknown) {
    console.log(
      `${red(
        'Cannot proceed deployment.'
      )}\nAre you sure the folder containing your built app (the "source" tag in the configuration file for Juno) files is correctly configured, or have you built your app?`
    );
    process.exit(1);
  }
};
