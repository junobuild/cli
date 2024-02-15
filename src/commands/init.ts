import {isNullish} from '@junobuild/utils';
import {cyan, red} from 'kleur';
import prompts from 'prompts';
import {
  getCliOrbiters,
  getCliSatellites,
  getToken,
  type CliOrbiterConfig,
  type CliSatelliteConfig
} from '../configs/cli.config';
import {
  junoConfigExist,
  junoConfigFile,
  saveOrbiterConfig,
  saveSatelliteConfig
} from '../configs/juno.config';
import {ConfigType} from '../types/config';

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

  const configType = await initConfigType();

  await saveSatelliteConfig({satellite: {satelliteId: satellite, source}, configType});
};

const initOrbiterConfig = async () => {
  const authOrbiters = getCliOrbiters();

  if (authOrbiters === undefined || authOrbiters.length === 0) {
    return;
  }

  const orbiter = await promptOrbiters(authOrbiters);

  if (orbiter === '_none_') {
    return;
  }

  await saveOrbiterConfig({orbiterId: orbiter});
};

const promptSatellites = async (satellites: CliSatelliteConfig[]): Promise<string> => {
  const {satellite}: {satellite: string} = await prompts({
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

const initConfigType = async (): Promise<ConfigType> => {
  if (!(await junoConfigExist())) {
    return await promptConfigType();
  }

  const {configType} = junoConfigFile();
  return configType;
};

const promptConfigType = async (): Promise<ConfigType> => {
  const {configType}: {configType: ConfigType} = await prompts({
    type: 'select',
    name: 'configType',
    message: 'What configuration file format do you prefer?',
    choices: [
      {title: 'TypeScript', value: 'ts'},
      {title: 'JavaScript', value: 'ts'},
      {title: 'JSON', value: 'json'}
    ],
    initial: 0
  });

  // In case of control+c
  assertAnswerCtrlC(configType);

  return configType;
};

const promptSatellite = async (): Promise<string> => {
  const {satellite}: {satellite: string} = await prompts([
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
  const {source}: {source: string} = await prompts([
    {
      type: 'text',
      name: 'source',
      message: `What is the location of your compiled app files? They are often found in the "build" or "dist" folders.`,
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
  const {orbiter}: {orbiter: string} = await prompts({
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
