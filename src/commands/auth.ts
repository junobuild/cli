import {Ed25519KeyIdentity} from '@dfinity/identity';
import {green} from 'kleur';
import prompts from 'prompts';
import {clearAuthConfig, getToken} from '../configs/auth.config';
import {login as consoleLogin} from '../services/console.services';

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

  // In case of control+c
  if (action === undefined || action === '') {
    process.exit(1);
  }

  if (action === 'login') {
    await consoleLogin(args);
    return;
  }

  await reuse(args);
};

const reuse = async (args?: string[]) => {
  const {segment} = await prompts({
    type: 'select',
    name: 'segment',
    message: 'Which new segment would you like to authorize with your controller?',
    choices: [
      {title: 'A satellite', value: 'satellite'},
      {title: 'The orbiter for the analytics', value: 'orbiter'},
      {title: 'Your mission control', value: 'mission_control'}
    ],
    initial: 0
  });

  // In case of control+c
  if (segment === undefined || segment === '') {
    process.exit(1);
  }
};
