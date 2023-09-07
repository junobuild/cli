import {Ed25519KeyIdentity} from '@dfinity/identity';
import {Principal} from '@dfinity/principal';
import {bold, green, red} from 'kleur';
import prompts from 'prompts';
import {clearAuthConfig, getToken, getUse, saveAuthOrbiter} from '../configs/auth.config';
import {CONSOLE_URL} from '../constants/constants';
import {login as consoleLogin} from '../services/console.services';
import {AssetKey} from '../types/asset-key';
import {terminalLink} from '../utils/links.utils';
import {confirmAndExit} from '../utils/prompt.utils';
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

  await reuse(identity.getPrincipal());
};

const reuse = async (controller: Principal) => {
  const segment = await selectSegment();

  console.log(
    `Great. Before completing the setup, you'll need to add the controller to your ${segment} in Juno's console.\n\nHere are the steps to follow:`
  );

  await setControllerManually({controller, segment});

  const {segmentId} = await prompts({
    type: 'text',
    name: 'segmentId',
    message: `Good. So, what's the ${green(`${segment} ID`)} to which you just added the controller?`
  });

  if (segmentId === undefined) {
    console.log(`${red(`The ${segment} ID cannot be undefined.`)}`);
    return;
  }

  const profile = getUse();
  saveAuthOrbiter({
    profile,
    orbiter: {
      p: segmentId
    }
  });

  console.log(`\nDone. The ${segment} ${green(`${segmentId}`)} has been configured for your terminal. ✅`);
};

const selectSegment = async (): Promise<AssetKey> => {
  const {segment} = await prompts({
    type: 'select',
    name: 'segment',
    message: 'Which new segment would you like to authorize with your controller?',
    choices: [
      {title: 'A satellite', value: 'satellite'},
      {title: 'The orbiter for the analytics', value: 'orbiter'},
      {title: 'Your mission control', value: 'mission control'}
    ],
    initial: 0
  });

  assertAnswerCtrlC(segment);

  return segment as AssetKey;
};

const setControllerManually = async ({
  segment,
  controller
}: {
  segment: AssetKey;
  controller: Principal;
}) => {
  const url = `${CONSOLE_URL}${
    segment === 'orbiter' ? '/analytics' : segment === 'satellite' ? '' : '/mission-control'
  }`;

  console.log(
    `\n1. Open the "${segment === 'orbiter' ? 'Settings' : 'Controllers'}" tab on ${terminalLink(
      url
    )}`
  );
  console.log(
    `2. Add the controller ${green(controller.toText())} to your ${segment} with the ${bold(
      'ADMIN'
    )} scope`
  );
  console.log(`3. Copy the ${green(`${segment} ID`)} to which you added the controller\n`);

  await confirmAndExit('Have you completed this step?');
};
