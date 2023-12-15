import {deleteAssets} from '@junobuild/core-peer';
import ora from 'ora';
import {readSatelliteConfig} from '../configs/juno.config';
import {DAPP_COLLECTION} from '../constants/constants';
import {satelliteParameters} from '../utils/satellite.utils';

export const clear = async () => {
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
