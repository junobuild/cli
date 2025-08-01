import {notEmptyString} from '@dfinity/utils';
import {type PrincipalText} from '@dfinity/zod-schemas';
import {green, red} from 'kleur';
import ora from 'ora';
import {saveCliConfig} from '../../configs/cli.config';
import {readEmulatorConfig} from '../../configs/emulator.config';
import {readJunoConfig} from '../../configs/juno.config';
import {ENV} from '../../env';
import {generateToken} from '../../utils/auth.utils';
import {assertConfigAndReadSatelliteId} from '../../utils/satellite.utils';
import {dispatchRequest} from '../emulator/emulator.admin.services';

export const loginEmulatorOnly = async () => {
  const spinner = ora('Granting terminal access...').start();

  try {
    const result = await loginEmulator();

    spinner.stop();

    if (result.status === 'validation-error') {
      return;
    }

    if (result.status === 'error') {
      console.log(
        red(
          `\nUnable to register your terminal as an access key for the Satellite running in the emulator.`
        )
      );
      return;
    }

    console.log(
      `\n🔓 Your terminal is authenticated with admin access as: ${green(result.principal)}`
    );
  } catch (err: unknown) {
    spinner.stop();
    throw err;
  }
};

const loginEmulator = async (): Promise<
  {status: 'success'; principal: PrincipalText} | {status: 'error'} | {status: 'validation-error'}
> => {
  // We read directly the Juno config because we cannot load an actor at this point as we are login in.
  // i.e. we cannot use assertConfigAndLoadSatelliteContext
  const {satellite: satelliteConfig} = await readJunoConfig(ENV);
  const {satelliteId} = assertConfigAndReadSatelliteId({satellite: satelliteConfig, env: ENV});

  const parsedResult = await readEmulatorConfig();

  if (!parsedResult.success) {
    return {status: 'validation-error'};
  }

  const {principal, token} = generateToken();

  const {result} = await dispatchRequest({
    config: parsedResult.config,
    request: `satellite/controller/?id=${principal}&satelliteId=${satelliteId}${notEmptyString(ENV.profile) ? `&profile=${encodeURIComponent(ENV.profile)}` : ''}`,
    timeout: 10000
  });

  if (result !== 'ok') {
    return {status: 'error'};
  }

  await saveCliConfig({
    token,
    satellites: [{p: satelliteId, n: ''}],
    orbiters: null,
    missionControl: null
  });

  return {status: 'success', principal};
};
