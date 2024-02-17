import {setConfig} from '@junobuild/admin';
import ora from 'ora';
import {junoConfigExist, readJunoConfig} from '../configs/juno.config';
import {configEnv} from '../utils/config.utils';
import {satelliteParameters} from '../utils/satellite.utils';
import {init} from './init';

export const config = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    await init();
  }

  const env = configEnv(args);
  const {satellite} = await readJunoConfig(env);
  const {storage} = satellite;

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
      satellite: satelliteParameters({satellite, env})
    });
  } finally {
    spinner.stop();
  }
};
