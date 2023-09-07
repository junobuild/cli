import {Ed25519KeyIdentity} from '@dfinity/identity';
import {green} from 'kleur';
import prompts from 'prompts';
import {clearAuthConfig, getToken} from '../configs/auth.config';
import {reuseController} from '../services/controllers.services';
import {login as consoleLogin} from '../services/login.services';
import {assertAnswerCtrlC} from './init';

export const logout = async () => {
  clearAuthConfig();

  console.log(`${green('Logged out')}`);
};

export const login = async (args?: string[]) => {
  const token = getToken();

  if (!token) {
    await consoleLogin(args);
    return;
  }

  const identity = Ed25519KeyIdentity.fromParsedJson(token);
  console.log(
    `🔐 Your terminal is already a controller: ${green(identity.getPrincipal().toText())}.\n`
  );

  const {action} = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      {title: `Create a new controller via a login with your browser`, value: `login`},
      {title: `Reuse the existing controller`, value: `reuse`}
    ]
  });

  assertAnswerCtrlC(action);

  if (action === 'login') {
    await consoleLogin(args);
    return;
  }

  await reuseController(identity.getPrincipal());
};
