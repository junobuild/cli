import {deleteAssets} from '@junobuild/core-peer';
import ora from 'ora';
import {dappConfigExist, readSatelliteConfig} from '../configs/dapp.config';
import {DAPP_COLLECTION} from '../constants/constants';
import {consoleNoConfigFound} from '../utils/msg.utils';
import {satelliteParameters} from '../utils/satellite.utils';

export const clear = async () => {
  if (!(await dappConfigExist())) {
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
