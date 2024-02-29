import {isNullish, nonNullish} from '@junobuild/utils';
import {cyan, red, yellow} from 'kleur';
import {unlink} from 'node:fs/promises';
import {basename} from 'node:path';
import prompts from 'prompts';
import {
  getCliOrbiters,
  getCliSatellites,
  getToken,
  type CliOrbiterConfig,
  type CliSatelliteConfig
} from '../configs/cli.config';
import {junoConfigExist, junoConfigFile, writeJunoConfig} from '../configs/juno.config';
import {promptConfigType} from '../services/init.services';
import type {ConfigType} from '../types/config';
import {NEW_CMD_LINE, confirmAndExit} from '../utils/prompt.utils';

export const init = async () => {
  const token = getToken();

  if (isNullish(token)) {
    console.log(`No controller found. Run ${cyan('login')} to get started 🚀.`);
    return;
  }

  if (await junoConfigExist()) {
    await confirmAndExit(
      'Your existing configuration will be overwritten. Are you sure you want to continue?'
    );
  }

  await initConfig();
};

const initConfig = async () => {
  const satelliteId = await initSatelliteConfig();
  const orbiterId = await initOrbiterConfig();

  const source = await promptSource();

  const {configType, configPath: originalConfigPath} = await initConfigType();

  await writeJunoConfig({
    config: {
      satellite: {id: satelliteId, source},
      ...(nonNullish(orbiterId) && {orbiter: {id: orbiterId}})
    },
    configType
  });

  // We delete the deprecated juno.json, which is now replaced with juno.config.json|ts|js, as just created above.
  // The developer was prompted about overwriting the configuration previously.
  if (nonNullish(originalConfigPath) && basename(originalConfigPath) === 'juno.json') {
    await unlink(originalConfigPath);
  }

  if (configType === 'json') {
    return;
  }

  console.log(
    `${NEW_CMD_LINE}💡 You can leverage your IDE's intellisense with type hints by installing the library: ${yellow('npm i @junobuild/config -D')}${NEW_CMD_LINE}`
  );
};

const initSatelliteConfig = async (): Promise<string> => {
  const satellites = getCliSatellites();

  const satellite = await (satellites?.length > 0
    ? promptSatellites(satellites)
    : promptSatellite());

  if (satellite === '_manual_') {
    return await promptSatellite();
  }

  return satellite;
};

const initOrbiterConfig = async (): Promise<string | undefined> => {
  const authOrbiters = getCliOrbiters();

  if (authOrbiters === undefined || authOrbiters.length === 0) {
    return undefined;
  }

  const orbiter = await promptOrbiters(authOrbiters);

  if (orbiter === '_none_') {
    return undefined;
  }

  return orbiter;
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

const initConfigType = async (): Promise<{configPath?: string; configType: ConfigType}> => {
  if (!(await junoConfigExist())) {
    const configType = await promptConfigType();
    return {configType};
  }

  return junoConfigFile();
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
