import {deleteAssets} from '@junobuild/core';
import {red} from 'kleur';
import ora from 'ora';
import {DAPP_COLLECTION} from '../constants/constants';
import {junoConfigExist, readSatelliteConfig} from '../utils/satellite.config.utils';
import {satelliteParameters} from '../utils/satellite.utils';

export const clear = async () => {
  if (!(await junoConfigExist())) {
    console.log(`${red('No configuration found.')}`);
    return;
  }

  const {satelliteId} = await readSatelliteConfig();

  const spinner = ora('Clearing dapp assets...').start();

  try {
    await deleteAssets({
      collection: DAPP_COLLECTION,
      satellite: satelliteParameters(satelliteId)
    });
  } finally {
    spinner.stop();
  }
};
