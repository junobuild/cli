import {readEmulatorConfig} from '../../configs/emulator.config';
import {generateToken} from '../../utils/auth.utils';
import {dispatchRequest} from '../emulator/emulator.admin.services';

import {green, red} from 'kleur';
import {saveCliConfig} from '../../configs/cli.config';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';

export const loginEmulatorOnly = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext();
  const {satelliteId} = satellite;

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
    satellites: [{p: satelliteId, n: ""}],
    orbiters: null,
    missionControl: null
  });

  console.log(`\n🔓 Your terminal is authenticated with admin access as: ${green(principal)}`);
};
