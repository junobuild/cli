import {nonNullish} from '@dfinity/utils';
import {assertAnswerCtrlC, execute} from '@junobuild/cli-tools';
import {type EmulatorConfig, EmulatorConfigSchema, type EmulatorPorts} from '@junobuild/config';
import type {PartialConfigFile} from '@junobuild/config-loader';
import {basename, join} from 'node:path';
import prompts from 'prompts';
import {detectJunoConfigType, junoConfigExist, junoConfigFile, readJunoConfig} from '../../../configs/juno.config';
import {detectJunoDevConfigType, junoDevConfigExist, junoDevConfigFile} from '../../../configs/juno.dev.config';
import {JUNO_DEV_CONFIG_FILENAME} from '../../../constants/constants';
import {
  EMULATOR_PORT_ADMIN,
  EMULATOR_PORT_CONSOLE,
  EMULATOR_PORT_SERVER,
  EMULATOR_SATELLITE,
  EMULATOR_SKYLAB
} from '../../../constants/emulator.constants';
import {ENV} from '../../../env';
import {
  assertDockerRunning,
  checkDockerVersion,
  hasExistingDockerContainer,
  isDockerContainerRunning
} from '../../../utils/env.utils';
import {copyTemplateFile} from '../../../utils/fs.utils';
import {readPackageJson} from '../../../utils/pkg.utils';
import {confirmAndExit} from '../../../utils/prompt.utils';
import {initConfigNoneInteractive, promptConfigType} from '../../init.services';

const TEMPLATE_PATH = '../templates/docker';
const DESTINATION_PATH = process.cwd();

export const startContainer = async () => {
  const {valid} = await checkDockerVersion();

  if (valid === 'error' || !valid) {
    return;
  }

  await assertDockerRunning();

  await assertAndInitConfig();

  console.log('🧪 Launching local emulator...');

  await runDocker();
};

export const stop = async () => {
  const {valid} = await checkDockerVersion();

  if (valid === 'error' || !valid) {
    return;
  }

  await assertDockerRunning();

  await execute({
    command: 'docker',
    args: ['compose', 'stop']
  });
};

const initJunoDevConfigFile = async () => {
  if (await junoDevConfigExist()) {
    return;
  }

  await confirmAndExit(
    `A config file is required for development. Would you like the CLI to create one for you?`
  );

  const {configType, configPath} = await buildConfigType('satellite');

  await copyTemplateFile({
    template: `${JUNO_DEV_CONFIG_FILENAME}.${configType}`,
    sourceFolder: TEMPLATE_PATH,
    destinationFolder: DESTINATION_PATH,
    ...(nonNullish(configPath) && {destinationFilename: configPath})
  });
};

const initJunoConfigFile = async () => {
  await confirmAndExit(`Your project needs a config file for Juno. Should we create one now?`);

  await initConfigNoneInteractive();
};

type ConfigContext = 'skylab' | 'satellite';

const buildConfigType = async (context: ConfigContext): Promise<PartialConfigFile> => {
  // We try to automatically detect if we should create a TypeScript or JavaScript (mjs) configuration.
  const fn = context === 'satellite' ? detectJunoDevConfigType : detectJunoConfigType;
  const detectedConfig = fn();

  if (nonNullish(detectedConfig)) {
    return detectedConfig;
  }

  const configType = await promptConfigType();

  return {configType};
};

const promptEmulatorType = async (): Promise<{emulatorType: 'skylab' | 'satellite'}> => {
  const {emulatorType}: {emulatorType: 'skylab' | 'satellite' | undefined} = await prompts({
    type: 'select',
    name: 'emulatorType',
    message: 'What kind of emulator would you like to run locally?',
    choices: [
      {
        title: `Production-like setup with Console UI and known services`,
        value: `skylab`
      },
      {title: `Minimal setup without any UI`, value: `satellite`}
    ]
  });

  assertAnswerCtrlC(emulatorType);

  return {emulatorType};
};

const assertAndInitConfig = async () => {
  const configExist = await junoConfigExist();

  if (configExist) {
    return;
  }

  const {emulatorType} = (await junoDevConfigExist())
    ? {emulatorType: 'satellite'}
    : await promptEmulatorType();

  await initConfigFile(emulatorType === 'skylab');
};

const initConfigFile = async (skylab: boolean) => {
  await initJunoConfigFile();

  if (skylab) {
    return;
  }

  await initJunoDevConfigFile();
};

const runDocker = async () => {
  const normalizeDockerName = (pkgName: string): string =>
    pkgName
      .replace(/^@[^/]+\//, '')
      .replace(/[^a-zA-Z0-9_.-]/g, '-')
      .replace(/^[^a-zA-Z0-9]+/, '')
      .toLowerCase();

  const readProjectName = async (): Promise<string | undefined> => {
    try {
      const {name} = await readPackageJson();
      return name;
    } catch (_err: unknown) {
      // This should not block the developer therefore we fallback to core which is the common way of using the library
      return undefined;
    }
  };

  const getEmulatorConfig = async (): Promise<EmulatorConfig> => {
    const configExist = await junoConfigExist();
    const devConfigExist = await junoDevConfigExist();

    if (!configExist && !devConfigExist) {
      return {skylab: EMULATOR_SKYLAB};
    }

    if (!configExist && devConfigExist) {
      return {satellite: EMULATOR_SATELLITE};
    }

    const config = await readJunoConfig(ENV);
    return config.emulator ?? {skylab: EMULATOR_SKYLAB};
  };

  const config = await getEmulatorConfig();

  const {success} = EmulatorConfigSchema.safeParse(config);
  if (!success) {
    // TODO
    console.log('Not valid');
    return;
  }

  const emulatorType =
    'satellite' in config ? 'satellite' : 'console' in config ? 'console' : 'skylab';

  const containerName = normalizeDockerName((config?.runner?.name ?? await readProjectName()) ?? `juno-${emulatorType}`);

  const result = await isDockerContainerRunning({containerName});

  if ('err' in result) {
    // TODO: show error
    return;
  }

  if (result.running) {
    // TODO: show error already started
    return;
  }

  const status = await hasExistingDockerContainer({containerName});

  if ('err' in status) {
    // TODO: show error
    return;
  }

  if (status.exist) {
    // Support for Ctrl+C:
    // -a: Attach STDOUT/STDERR. Equivalent to `--attach`.
    // -i: Keep STDIN open even if not attached. Equivalent to `--interactive`.
    await execute({
      command: 'docker',
      args: ['start', '-a', '-i', containerName]
    });
    return;
  }

  const ports: Required<EmulatorPorts> = {
    server: config[emulatorType]?.ports?.server ?? EMULATOR_SKYLAB.ports.server,
    admin: config[emulatorType]?.ports?.admin ?? EMULATOR_SKYLAB.ports.admin
  };

  // Support Ctrl+C:
  // -i: Keeps STDIN open for the container. Equivalent to `--interactive`.
  // -t: Allocates a pseudo-TTY, enabling terminal-like behavior. Equivalent to `--tty`.

  /**
   * Example:
   *
   * docker run -it \
   *   --name juno-skylab-aaabbb \
   *   -p 5987:5987 \
   *   -p 5999:5999 \
   *   -p 5866:5866 \
   *   -v juno_skylab_test_61:/juno/.juno \
   *   -v "$(pwd)/juno.config.mjs:/juno/juno.config.mjs" \
   *   -v "$(pwd)/target/deploy:/juno/target/deploy" \
   *   juno-skylab-pocket-ic
   */

  const volume = config.runner?.volume ?? containerName.replaceAll('-', '_');

  const fn = emulatorType === 'satellite' ? junoDevConfigFile : junoConfigFile;
  const detectedConfig = fn();
  const configFile = nonNullish(detectedConfig?.configPath)
    ? basename(detectedConfig.configPath)
    : undefined;
  const configFilePath = nonNullish(configFile) ? join(process.cwd(), configFile) : undefined;

  const targetDeploy = config.runner?.target ?? join(process.cwd(), 'target', 'deploy');

  const image = config.runner?.image ?? `junobuild/${emulatorType}:latest`;

  await execute({
    command: 'docker',
    args: [
      'run',
      '-it',
      '--name',
      containerName,
      '-p',
      `${ports.server}:${EMULATOR_PORT_SERVER}`,
      '-p',
      `${ports.admin}:${EMULATOR_PORT_ADMIN}`,
      ...('skylab' in config
        ? [
            '-p',
            `${config.skylab.ports?.console ?? EMULATOR_SKYLAB.ports.console}:${EMULATOR_PORT_CONSOLE}`
          ]
        : []),
      '-v',
      `${volume}:/juno/.juno`,
      ...(nonNullish(configFile) && nonNullish(configFilePath)
        ? ['-v', `${configFilePath}:/juno/${configFile}`]
        : []),
      '-v',
      `${targetDeploy}:/juno/target/deploy`,
      image
    ]
  });
};
