import {deleteAssets} from '@junobuild/core-peer';
import ora from 'ora';
import {junoConfigExist, readSatelliteConfig} from '../configs/satellite.config';
import {DAPP_COLLECTION} from '../constants/constants';
import {consoleNoConfigFound} from '../utils/msg.utils';
import {satelliteParameters} from '../utils/satellite.utils';

export const clear = async () => {
  if (!(await junoConfigExist())) {
    consoleNoConfigFound();
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
