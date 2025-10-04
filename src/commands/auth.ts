import {Ed25519KeyIdentity} from '@dfinity/identity';
import {isNullish} from '@dfinity/utils';
import {assertAnswerCtrlC, hasArgs} from '@junobuild/cli-tools';
import {green, red} from 'kleur';
import prompts from 'prompts';
import {clearCliConfig, getToken} from '../configs/cli.config';
import {DEV} from '../env';
import {loginEmulatorOnly} from '../services/auth/login.emulator.services';
import {login as loginServices} from '../services/auth/login.services';
import {reuseController} from '../services/controllers.services';
import {isHeadless} from '../utils/process.utils';
import {confirmAndExit} from '../utils/prompt.utils';

export const logout = async () => {
  await clearCliConfig();

  console.log(green('Logged out'));
};

export const login = async (args?: string[]) => {
  if (hasArgs({args, options: ['-e', '--emulator']})) {
    await emulatorLogin();
    return;
  }

  await consoleLogin(args);
};

const consoleLogin = async (args?: string[]) => {
  const token = await getToken();

  if (isNullish(token)) {
    await loginServices(args);
    return;
  }

  const identity = Ed25519KeyIdentity.fromParsedJson(token);
  console.log(`🔐 Your terminal already has access: ${green(identity.getPrincipal().toText())}\n`);

  const {action}: {action: string} = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      {title: `Create a new access key by logging in with your browser`, value: `login`},
      {title: `Reuse the access key used by your CLI`, value: `reuse`}
    ]
  });

  assertAnswerCtrlC(action);

  if (action === 'login') {
    await loginServices(args);
    return;
  }

  await reuseController(identity.getPrincipal());
};

const emulatorLogin = async () => {
  if (!DEV) {
    console.log(red('The login option --emulator is only supported in development mode.'));
    return;
  }

  if (isHeadless()) {
    await loginEmulatorOnly();
    return;
  }

  const token = await getToken();

  if (isNullish(token)) {
    await loginEmulatorOnly();
    return;
  }

  const identity = Ed25519KeyIdentity.fromParsedJson(token);
  console.log(`🔐 Your terminal already has access: ${green(identity.getPrincipal().toText())}\n`);

  await confirmAndExit(
    'Would you like to overwrite the saved development authentication on this device'
  );

  await loginEmulatorOnly();
};
