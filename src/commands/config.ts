import {setConfig} from '@junobuild/admin';
import ora from 'ora';
import {junoConfigExist, readSatelliteConfig} from '../configs/satellite.config';
import {satelliteParameters} from '../utils/satellite.utils';
import {init} from './init';

export const config = async () => {
  if (!(await junoConfigExist())) {
    await init();
  }

  const {satelliteId, storage} = await readSatelliteConfig();

  const spinner = ora(`Configuring...`).start();

  try {
    await setConfig({
      config: {
        storage: {
          headers: storage?.headers ?? [],
          rewrites: storage?.rewrites
        }
      },
      satellite: satelliteParameters(satelliteId)
    });
  } finally {
    spinner.stop();
  }
};
