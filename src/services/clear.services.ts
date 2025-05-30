import {deleteAssets, listCustomDomains, setCustomDomains} from '@junobuild/admin';
import {deleteAsset} from '@junobuild/core';
import ora from 'ora';
import {readJunoConfig} from '../configs/juno.config';
import {DAPP_COLLECTION} from '../constants/constants';
import {configEnv} from '../utils/config.utils';
import {satelliteParameters} from '../utils/satellite.utils';

export const clear = async (args?: string[]) => {
  const env = configEnv(args);
  const {satellite: satelliteConfig} = await readJunoConfig(env);

  const satellite = await satelliteParameters({satellite: satelliteConfig, env});

  const spinner = ora('Clearing app assets...').start();

  try {
    // TODO: to be removed. Workaround as temporary solution of https://github.com/junobuild/juno/issues/484.
    const domains = await listCustomDomains({satellite});

    await deleteAssets({
      collection: DAPP_COLLECTION,
      satellite
    });

    await setCustomDomains({
      satellite,
      domains
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

  const satellite = await satelliteParameters({satellite: satelliteConfig, env});

  const spinner = ora(`Clearing ${fullPath}...`).start();

  try {
    await deleteAsset({
      collection: DAPP_COLLECTION,
      satellite,
      fullPath: cleanFullPath(fullPath)
    });
  } finally {
    spinner.stop();
  }
};
