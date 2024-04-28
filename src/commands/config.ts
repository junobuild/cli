import {setAuthConfig, setConfig} from '@junobuild/admin';
import {isNullish} from '@junobuild/utils';
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
  const {satellite: satelliteConfig} = await readJunoConfig(env);
  const {storage, authentication} = satelliteConfig;

  const satellite = satelliteParameters({satellite: satelliteConfig, env});

  const spinner = ora(`Configuring...`).start();

  try {
    await Promise.allSettled([
      setConfig({
        config: {
          storage: {
            headers: storage?.headers ?? [],
            rewrites: storage?.rewrites,
            redirects: storage?.redirects,
            iframe: storage?.iframe
          }
        },
        satellite
      }),
      ...(isNullish(authentication)
        ? []
        : [
            setAuthConfig({
              config: {
                authentication
              },
              satellite
            })
          ])
    ]);
  } finally {
    spinner.stop();
  }
};
