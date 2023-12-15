import {setConfig} from '@junobuild/admin';
import ora from 'ora';
import {dappConfigExist, readSatelliteConfig} from '../configs/dapp.config';
import {satelliteParameters} from '../utils/satellite.utils';
import {init} from './init';

export const config = async () => {
  if (!(await dappConfigExist())) {
    await init();
  }

  const {satelliteId, storage} = await readSatelliteConfig();

  const spinner = ora(`Configuring...`).start();

  try {
    await setConfig({
      config: {
        storage: {
          headers: storage?.headers ?? [],
          rewrites: storage?.rewrites,
          redirects: storage?.redirects,
          iframe: storage?.iframe
        }
      },
      satellite: satelliteParameters(satelliteId)
    });
  } finally {
    spinner.stop();
  }
};
