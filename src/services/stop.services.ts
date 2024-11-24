import {junoConfigExist, readJunoConfig} from '../configs/juno.config';
import {configEnv} from '../utils/config.utils';
import {consoleNoConfigFound} from '../utils/msg.utils';
import {satelliteParameters} from '../utils/satellite.utils';

export const stopSatellite = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    consoleNoConfigFound();
    return;
  }

  const env = configEnv(args);
  const {satellite: satelliteConfig} = await readJunoConfig(env);

  const satellite = await satelliteParameters({satellite: satelliteConfig, env});
  const {satelliteId} = satellite;
};
