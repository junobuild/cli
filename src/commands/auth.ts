import {Ed25519KeyIdentity} from '@dfinity/identity';
import {isNullish} from '@dfinity/utils';
import {assertAnswerCtrlC} from '@junobuild/cli-tools';
import {green} from 'kleur';
import prompts from 'prompts';
import {clearCliConfig, getToken} from '../configs/cli.config';
import {DEV} from '../env';
import {loginEmulatorOnly} from '../services/auth/login.emulator.services';
import {login as consoleLogin} from '../services/auth/login.services';
import {reuseController} from '../services/controllers.services';
import {isHeadless} from '../utils/process.utils';

export const logout = async () => {
  await clearCliConfig();

  console.log(green('Logged out'));
};

export const login = async (args?: string[]) => {
  const token = await getToken();

  if (isNullish(token) && isHeadless() && DEV) {
    await loginEmulatorOnly();
    return;
  }

  if (isNullish(token)) {
    await consoleLogin(args);
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
    await consoleLogin(args);
    return;
  }

  await reuseController(identity.getPrincipal());
};
