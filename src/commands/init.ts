import {isNullish} from '@junobuild/utils';
import {cyan, red} from 'kleur';
import prompts from 'prompts';
import {
  CliOrbiterConfig,
  getCliOrbiters,
  getCliSatellites,
  getToken,
  type CliSatelliteConfig
} from '../configs/cli.config';
import {saveOrbiterConfig, saveSatelliteConfig} from '../configs/juno.config';

export const init = async () => {
  const token = getToken();

  if (isNullish(token)) {
    console.log(`No controller found. Run ${cyan('login')} to get started 🚀.`);
    return;
  }

  await initSatelliteConfig();
  await initOrbiterConfig();
};

const initSatelliteConfig = async () => {
  const satellites = getCliSatellites();

  let satellite = await (satellites?.length > 0 ? promptSatellites(satellites) : promptSatellite());

  if (satellite === '_manual_') {
    satellite = await promptSatellite();
  }

  const source = await promptSource();

  await saveSatelliteConfig({satelliteId: satellite, source});
};

const initOrbiterConfig = async () => {
  const authOrbiters = getCliOrbiters();

  if (authOrbiters === undefined || authOrbiters.length === 0) {
    return;
  }

  let orbiter = await promptOrbiters(authOrbiters);

  if (orbiter === '_none_') {
    return;
  }

  await saveOrbiterConfig({orbiterId: orbiter});
};

const promptSatellites = async (satellites: CliSatelliteConfig[]): Promise<string> => {
  const {satellite} = await prompts({
    type: 'select',
    name: 'satellite',
    message: 'Which satellite should be linked with this dapp?',
    choices: [
      ...satellites.map(({p, n}) => ({title: n, value: p})),
      {title: '<not listed, manual entry>', value: '_manual_'}
    ],
    initial: 0
  });

  // In case of control+c
  assertAnswerCtrlC(satellite);

  return satellite;
};

const promptSatellite = async (): Promise<string> => {
  const {satellite} = await prompts([
    {
      type: 'text',
      name: 'satellite',
      message: `What's the ${cyan('id')} of your satellite?`
    }
  ]);

  assertAnswerCtrlC(satellite, 'The satellite ID is mandatory');

  return satellite;
};

const promptSource = async (): Promise<string> => {
  const {source} = await prompts([
    {
      type: 'text',
      name: 'source',
      message: `What's the name or path of the folder containing your built dapp files?`,
      initial: 'build'
    }
  ]);

  assertAnswerCtrlC(source);

  return source;
};

// In case an answer is replaced by control+c
export const assertAnswerCtrlC: (
  answer: null | undefined | '' | string,
  message?: string
) => asserts answer is NonNullable<string> = (
  answer: null | undefined | '' | string,
  message?: string
): void => {
  if (answer === undefined || answer === '' || answer === null) {
    if (message !== undefined) {
      console.log(`${red(message)}`);
    }

    process.exit(1);
  }
};

const promptOrbiters = async (orbiters: CliOrbiterConfig[]): Promise<string> => {
  const {orbiter} = await prompts({
    type: 'select',
    name: 'orbiter',
    message: 'Which orbiter do you use for the analytics in this dapp?',
    choices: [
      ...orbiters.map(({p, n}) => ({title: n ?? p, value: p})),
      {title: '<none>', value: '_none_'}
    ],
    initial: 0
  });

  // In case of control+c
  assertAnswerCtrlC(orbiter);

  return orbiter;
};
