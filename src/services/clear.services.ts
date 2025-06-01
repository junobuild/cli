import {deleteAssets, listCustomDomains, setCustomDomains} from '@junobuild/admin';
import {deleteAsset} from '@junobuild/core';
import {green} from 'kleur';
import ora from 'ora';
import {DAPP_COLLECTION} from '../constants/constants';
import {assertConfigAndLoadSatelliteContext} from '../utils/satellite.utils';

export const clear = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);

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

    console.log(`${green('✔')} App assets cleared.`);
  } finally {
    spinner.stop();
  }
};

const cleanFullPath = (fullPath: string): string => {
  const path = fullPath.replace(/\\/g, '/');
  return `${path.startsWith('/') ? '' : '/'}${path}`;
};

export const clearAsset = async ({fullPath, args}: {fullPath: string; args?: string[]}) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);

  const spinner = ora(`Clearing ${fullPath}...`).start();

  try {
    await deleteAsset({
      collection: DAPP_COLLECTION,
      satellite,
      fullPath: cleanFullPath(fullPath)
    });

    console.log(`${green('✔')} ${fullPath} cleared.`);
  } finally {
    spinner.stop();
  }
};
