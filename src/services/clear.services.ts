import {deleteAssets} from '@junobuild/admin';
import {deleteAsset} from '@junobuild/core-peer';
import ora from 'ora';
import {readJunoConfig} from '../configs/juno.config';
import {DAPP_COLLECTION} from '../constants/constants';
import {configEnv} from '../utils/config.utils';
import {satelliteParameters} from '../utils/satellite.utils';

export const clear = async (args?: string[]) => {
  const env = configEnv(args);
  const {satellite: satelliteConfig} = await readJunoConfig(env);

  const spinner = ora('Clearing dapp assets...').start();

  try {
    await deleteAssets({
      collection: DAPP_COLLECTION,
      satellite: satelliteParameters({satellite: satelliteConfig, env})
    });
  } finally {
    spinner.stop();
  }
};

const cleanFullPath = (fullPath: string): string => {
  const path = fullPath.replace(/\\/g, '/');
  return `${path.startsWith('/') ? '' : '/'}${path}`;
};

export const clearAsset = async ({fullPath, args}: {fullPath: string; args?: string[]}) => {
  const env = configEnv(args);
  const {satellite: satelliteConfig} = await readJunoConfig(env);

  const spinner = ora(`Clearing ${fullPath}...`).start();

  try {
    await deleteAsset({
      collection: DAPP_COLLECTION,
      satellite: satelliteParameters({satellite: satelliteConfig, env}),
      fullPath: cleanFullPath(fullPath)
    });
  } finally {
    spinner.stop();
  }
};
