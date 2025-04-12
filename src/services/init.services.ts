import {isNullish, nonNullish} from '@dfinity/utils';
import {assertAnswerCtrlC} from '@junobuild/cli-tools';
import type {ConfigType, PartialConfigFile} from '@junobuild/config-loader';
import {cyan, yellow} from 'kleur';
import {unlink} from 'node:fs/promises';
import {basename} from 'node:path';
import prompts from 'prompts';
import {getCliOrbiters, getCliSatellites} from '../configs/cli.config';
import {
  detectJunoConfigType,
  junoConfigExist,
  junoConfigFile,
  writeJunoConfig,
  writeJunoConfigPlaceholder
} from '../configs/juno.config';
import type {CliOrbiterConfig, CliSatelliteConfig} from '../types/cli.config';
import type {PackageManager} from '../types/pm';
import {detectPackageManager} from '../utils/pm.utils';
import {NEW_CMD_LINE} from '../utils/prompt.utils';

export const promptConfigType = async (): Promise<ConfigType> => {
  const {configType}: {configType: ConfigType} = await prompts({
    type: 'select',
    name: 'configType',
    message: 'What configuration file format do you prefer?',
    choices: [
      {title: 'TypeScript', value: 'ts'},
      {title: 'JavaScript', value: 'js'},
      {title: 'JSON', value: 'json'}
    ],
    initial: 0
  });

  // In case of control+c
  assertAnswerCtrlC(configType);

  return configType;
};

export type InitConfigParams = PartialConfigFile & {pm: PackageManager | undefined} & {
  source: string;
};

export const initConfigNoneInteractive = async () => {
  const writeFn = async ({source, ...rest}: InitConfigParams) => {
    await writeJunoConfigPlaceholder({
      ...rest,
      config: {
        satellite: {source}
      }
    });
  };

  await initConfig({
    writeFn
  });
};

export const initConfigInteractive = async () => {
  const satelliteId = await initSatelliteConfig();
  const orbiterId = await initOrbiterConfig();

  const writeFn = async ({source, ...rest}: InitConfigParams) => {
    await writeJunoConfig({
      ...rest,
      config: {
        satellite: {id: satelliteId, source},
        ...(nonNullish(orbiterId) && {orbiter: {id: orbiterId}})
      }
    });
  };

  await initConfig({
    writeFn
  });
};

const initConfig = async ({writeFn}: {writeFn: (params: InitConfigParams) => Promise<void>}) => {
  const pm = detectPackageManager();

  const source = await promptSource({pm});

  const {configType, configPath: originalConfigPath} = await initConfigType();

  await writeFn({
    configType,
    configPath: originalConfigPath,
    pm,
    source
  });

  // We delete the deprecated juno.json, which is now replaced with juno.config.json|ts|js, as just created above.
  // The developer was prompted about overwriting the configuration previously.
  if (nonNullish(originalConfigPath) && basename(originalConfigPath) === 'juno.json') {
    await unlink(originalConfigPath);
  }

  if (configType === 'json') {
    return;
  }

  showConfigTips({pm});
};

const promptSource = async ({pm}: {pm: PackageManager | undefined}): Promise<string> => {
  const cmd = `${pm ?? 'npm'}${isNullish(pm) || pm === 'npm' ? ' run' : ''} build`;

  const {output}: {output: string} = await prompts({
    type: 'select',
    name: 'output',
    message: `What is the output folder of your \`${cmd}\` command?`,
    choices: [
      {title: 'build', value: 'build'},
      {title: 'dist', value: 'dist'},
      {title: 'out', value: 'out'},
      {title: '<not listed, manual entry>', value: '_manual_'}
    ],
    initial: 0
  });

  // In case of control+c
  assertAnswerCtrlC(output);

  if (output !== '_manual_') {
    return output;
  }

  const {source}: {source: string} = await prompts([
    {
      type: 'text',
      name: 'source',
      message: 'Please enter the name of your output folder'
    }
  ]);

  assertAnswerCtrlC(source);

  return source;
};

const initConfigType = async (): Promise<PartialConfigFile> => {
  if (!(await junoConfigExist())) {
    // We try to automatically detect if we should create a TypeScript or JavaScript (mjs) configuration.
    const detectedConfig = detectJunoConfigType();

    if (nonNullish(detectedConfig)) {
      return detectedConfig;
    }

    const configType = await promptConfigType();
    return {configType};
  }

  return junoConfigFile();
};

const showConfigTips = ({pm}: {pm: PackageManager | undefined}) => {
  const cmd = `${pm ?? 'npm'} ${isNullish(pm) || pm === 'npm' ? 'i' : 'add'} @junobuild/config -D`;

  console.log(
    `${NEW_CMD_LINE}💡 You can leverage your IDE's intellisense by installing the library: ${yellow(cmd)}${NEW_CMD_LINE}`
  );
};

const initSatelliteConfig = async (): Promise<string> => {
  const satellites = await getCliSatellites();

  const satellite = await (satellites.length > 0
    ? promptSatellites(satellites)
    : promptSatellite());

  if (satellite === '_manual_') {
    return await promptSatellite();
  }

  return satellite;
};

const initOrbiterConfig = async (): Promise<string | undefined> => {
  const authOrbiters = await getCliOrbiters();

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
