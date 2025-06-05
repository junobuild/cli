import {isNullish} from '@dfinity/utils';
import {hasArgs} from '@junobuild/cli-tools';
import {cyan} from 'kleur';
import {getToken} from '../configs/cli.config';
import {junoConfigExist} from '../configs/juno.config';
import {initConfigInteractive, initConfigNoneInteractive} from '../services/init.services';
import {login as consoleLogin} from '../services/login.services';
import {confirm, confirmAndExit} from '../utils/prompt.utils';

export const init = async (args?: string[]) => {
  if (hasArgs({args, options: ['--minimal']})) {
    await initWithPlaceholder();
    return;
  }

  await initWithSatelliteId(args);
};

const initWithPlaceholder = async () => {
  await assertOverwrite();

  await initConfigNoneInteractive();
};

const initWithSatelliteId = async (args?: string[]) => {
  const token = await getToken();

  if (isNullish(token)) {
    const login = await confirm(
      `Your terminal is not authenticated. Would you like to ${cyan('log in')} now?`
    );

    if (!login) {
      return;
    }

    await consoleLogin(args);
  }

  await assertOverwrite();

  await initConfigInteractive();
};

const assertOverwrite = async () => {
  if (await junoConfigExist()) {
    await confirmAndExit(
      'Your existing configuration will be overwritten. Are you sure you want to continue?'
    );
  }
};
