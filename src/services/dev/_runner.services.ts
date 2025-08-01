import {nonNullish} from '@dfinity/utils';
import {assertAnswerCtrlC, execute, spawn} from '@junobuild/cli-tools';
import {type EmulatorPorts} from '@junobuild/config';
import type {PartialConfigFile} from '@junobuild/config-loader';
import {red, yellow} from 'kleur';
import {basename, join} from 'node:path';
import prompts from 'prompts';
import {readEmulatorConfig} from '../../configs/emulator.config';
import {detectJunoConfigType, junoConfigExist, junoConfigFile} from '../../configs/juno.config';
import {
  detectJunoDevConfigType,
  junoDevConfigExist,
  junoDevConfigFile
} from '../../configs/juno.dev.config';
import {JUNO_DEV_CONFIG_FILENAME} from '../../constants/constants';
import {
  EMULATOR_PORT_ADMIN,
  EMULATOR_PORT_CONSOLE,
  EMULATOR_PORT_SERVER,
  EMULATOR_SKYLAB
} from '../../constants/emulator.constants';
import {type CliEmulatorConfig, type CliEmulatorDerivedConfig} from '../../types/emulator';
import {copyTemplateFile} from '../../utils/fs.utils';
import {isHeadless} from '../../utils/process.utils';
import {confirmAndExit} from '../../utils/prompt.utils';
import {
  assertContainerRunnerRunning,
  checkDockerVersion,
  hasExistingContainer,
  isContainerRunning
} from '../../utils/runner.utils';
import {createDeployTargetDir} from '../emulator/emulator.fs.services';
import {initConfigNoneInteractive, promptConfigType} from '../init.services';

const TEMPLATE_PATH = '../templates/docker';
const DESTINATION_PATH = process.cwd();

export const startContainer = async () => {
  const parsedResult = await readEmulatorConfig();

  if (!parsedResult.success) {
    return;
  }

  const {config} = parsedResult;

  const {valid} =
    config.derivedConfig.runner === 'docker' ? await checkDockerVersion() : {valid: true};

  if (valid === 'error' || !valid) {
    return;
  }

  await assertContainerRunnerRunning({runner: config.derivedConfig.runner});

  await assertAndInitConfig();

  await startEmulator({config});
};

export const stopContainer = async () => {
  const parsedResult = await readEmulatorConfig();

  if (!parsedResult.success) {
    return;
  }

  const {config} = parsedResult;

  const {valid} =
    config.derivedConfig.runner === 'docker' ? await checkDockerVersion() : {valid: true};

  if (valid === 'error' || !valid) {
    return;
  }

  await assertContainerRunnerRunning({runner: config.derivedConfig.runner});

  await stopEmulator({config});
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

const startEmulator = async ({config: extendedConfig}: {config: CliEmulatorConfig}) => {
  const {
    config,
    derivedConfig: {emulatorType, containerName, runner, targetDeploy}
  } = extendedConfig;

  const {running} = await assertContainerRunning({containerName, runner});

  if (running) {
    console.log(yellow(`The ${runner} container ${containerName} is already running.`));
    return;
  }

  const status = await hasExistingContainer({containerName, runner});

  if ('err' in status) {
    console.log(red(`Unable to check if ${runner} container ${containerName} already exists.`));
    return;
  }

  console.log('🧪 Launching local emulator...');

  if (status.exist) {
    // Support for Ctrl+C:
    // -a: Attach STDOUT/STDERR. Equivalent to `--attach`.
    // -i: Keep STDIN open even if not attached. Equivalent to `--interactive`.
    await execute({
      command: runner,
      args: ['start', '-a', ...(isHeadless() ? [] : ['-i']), containerName]
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
  const configFile = nonNullish(detectedConfig.configPath)
    ? basename(detectedConfig.configPath)
    : undefined;
  const configFilePath = nonNullish(configFile) ? join(process.cwd(), configFile) : undefined;

  // Podman does not auto create the path folders.
  await createDeployTargetDir({targetDeploy});

  const image = config.runner?.image ?? `junobuild/${emulatorType}:latest`;

  const platform = config.runner?.platform;

  await execute({
    command: runner,
    args: [
      'run',
      ...(isHeadless() ? [] : ['-it']),
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
      ...(nonNullish(platform) ? [`--platform=${platform}`] : []),
      image
    ]
  });
};

const stopEmulator = async ({config: {derivedConfig}}: {config: CliEmulatorConfig}) => {
  const {containerName, runner} = derivedConfig;

  const {running} = await assertContainerRunning({containerName, runner});

  if (!running) {
    console.log(yellow(`The ${runner} container ${containerName} is already stopped.`));
    return;
  }

  await spawn({
    command: runner,
    args: ['stop', containerName],
    silentOut: true
  });
};

const assertContainerRunning = async ({
  containerName,
  runner
}: Pick<CliEmulatorDerivedConfig, 'containerName' | 'runner'>): Promise<{running: boolean}> => {
  const result = await isContainerRunning({containerName, runner});

  if ('err' in result) {
    console.log(
      red(`Unable to verify if container ${containerName} is running. Is ${runner} installed?`)
    );
    process.exit(1);
  }

  return result;
};
