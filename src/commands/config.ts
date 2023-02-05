import {setConfig} from '@junobuild/admin';
import {cyan, red} from 'kleur';
import {junoConfigExist, readSatelliteConfig} from '../utils/satellite.config.utils';
import {satelliteParameters} from '../utils/satellite.utils';
import {init} from './init';

export const config = async () => {
  if (!(await junoConfigExist())) {
    await init();
  }

  const {satelliteId, storage} = await readSatelliteConfig();

  if (!storage || !storage.trailingSlash) {
    console.log('No config for the storage, satellite unchanged.');
    return;
  }

  if (!['always', 'never'].includes(storage.trailingSlash)) {
    console.log(`${red('Unknown configuration option.')}`);
    return;
  }

  await setConfig({
    config: {
      storage
    },
    satellite: satelliteParameters(satelliteId)
  });

  console.log(`Run ${cyan('clear')} and ${cyan('deploy')} to apply the changes to your dapp.`);
};
