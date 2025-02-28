import {isNullish, nonNullish} from '@dfinity/utils';
import {assertAnswerCtrlC, hasArgs} from '@junobuild/cli-tools';
import type {PartialConfigFile} from '@junobuild/config-loader';
import {cyan, yellow} from 'kleur';
import {unlink} from 'node:fs/promises';
import {basename} from 'node:path';
import prompts from 'prompts';
import {getCliOrbiters, getCliSatellites, getToken} from '../configs/cli.config';
import {
  detectJunoConfigType,
  junoConfigExist,
  junoConfigFile,
  writeJunoConfig,
  writeJunoConfigPlaceholder
} from '../configs/juno.config';
import {promptConfigType} from '../services/init.services';
import {login as consoleLogin} from '../services/login.services';
import type {CliOrbiterConfig, CliSatelliteConfig} from '../types/cli.config';
import type {PackageManager} from '../types/pm';
import {detectPackageManager} from '../utils/pm.utils';
import {NEW_CMD_LINE, confirm, confirmAndExit} from '../utils/prompt.utils';

export const init = async (args?: string[]) => {
  if (hasArgs({args, options: ['-m', '--minimal']})) {
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

const initConfigNoneInteractive = async () => {
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

const initConfigInteractive = async () => {
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

type InitConfigParams = PartialConfigFile & {pm: PackageManager | undefined} & {source: string};

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
