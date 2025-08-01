import {readEmulatorConfig} from '../../configs/emulator.config';
import {generateToken} from '../../utils/auth.utils';
import {dispatchRequest} from '../emulator/emulator.admin.services';

import {green, red} from 'kleur';
import {saveCliConfig} from '../../configs/cli.config';
import {readJunoConfig} from '../../configs/juno.config';
import {ENV} from '../../env';
import {assertConfigAndReadSatelliteId} from '../../utils/satellite.utils';

export const loginEmulatorOnly = async () => {
  // We read directly the Juno config because we cannot load an actor at this point as we are login in.
  // i.e. we cannot use assertConfigAndLoadSatelliteContext
  const {satellite: satelliteConfig} = await readJunoConfig(ENV);
  const {satelliteId} = assertConfigAndReadSatelliteId({satellite: satelliteConfig, env: ENV});

  const parsedResult = await readEmulatorConfig();

  if (!parsedResult.success) {
    return;
  }

  const {principal, token} = generateToken();

  const {result} = await dispatchRequest({
    config: parsedResult.config,
    adminRequest: `satellite/controller/?id=${principal}`
  });

  if (result !== 'ok') {
    console.log(
      red(
        'Unable to register your terminal as an access key for the Satellite running in the emulator.'
      )
    );
    return;
  }

  await saveCliConfig({
    token,
    satellites: [{p: satelliteId, n: ''}],
    orbiters: null,
    missionControl: null
  });

  console.log(`\n🔓 Your terminal is authenticated with admin access as: ${green(principal)}`);
};
