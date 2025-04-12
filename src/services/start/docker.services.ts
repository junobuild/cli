import {nonNullish} from '@dfinity/utils';
import {assertAnswerCtrlC, execute} from '@junobuild/cli-tools';
import type {PartialConfigFile} from '@junobuild/config-loader';
import {existsSync} from 'node:fs';
import {readFile, writeFile} from 'node:fs/promises';
import {basename, join} from 'node:path';
import prompts from 'prompts';
import {detectJunoConfigType, junoConfigExist, junoConfigFile} from '../../configs/juno.config';
import {
  detectJunoDevConfigType,
  junoDevConfigExist,
  junoDevConfigFile
} from '../../configs/juno.dev.config';
import {JUNO_CONFIG_FILENAME, type JUNO_DEV_CONFIG_FILENAME} from '../../constants/constants';
import {assertDockerRunning, checkDockerVersion} from '../../utils/env.utils';
import {copyTemplateFile, readTemplateFile} from '../../utils/fs.utils';
import {confirmAndExit} from '../../utils/prompt.utils';
import {promptConfigType} from '../init.services';

const TEMPLATE_PATH = '../templates/docker';
const DESTINATION_PATH = process.cwd();
const DOCKER_COMPOSE_FILENAME = 'docker-compose.yml';

export const startContainer = async () => {
  const {valid} = await checkDockerVersion();

  if (valid === 'error' || !valid) {
    return;
  }

  await assertDockerRunning();

  await assertAndInitConfig();

  console.log('🧪 Launching local emulator...');

  await execute({
    command: 'docker',
    args: ['compose', 'up']
  });
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

const assertJunoDevConfig = async () => {
  if (await junoDevConfigExist()) {
    return;
  }

  await confirmAndExit(
    `A config file is required for development. Would you like the CLI to create one for you?`
  );

  const config = await buildConfigType('satellite');

  await copyConfigTemplate({
    template: JUNO_CONFIG_FILENAME,
    config
  });
};

const assertJunoConfig = async () => {
  if (await junoConfigExist()) {
    return;
  }

  await confirmAndExit(`Your project needs a config file for Juno. Should we create one now?`);

  const config = await buildConfigType('skylab');

  await copyConfigTemplate({
    template: JUNO_CONFIG_FILENAME,
    config
  });
};

type ConfigContext = 'skylab' | 'satellite';

const copyConfigTemplate = async ({
  template,
  config: {configType, configPath}
}: {
  template: typeof JUNO_CONFIG_FILENAME | typeof JUNO_DEV_CONFIG_FILENAME;
  config: PartialConfigFile;
}) => {
  await copyTemplateFile({
    template: `${template}.${configType}`,
    sourceFolder: TEMPLATE_PATH,
    destinationFolder: DESTINATION_PATH,
    ...(nonNullish(configPath) && {destinationFilename: configPath})
  });
};

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

const assertDockerCompose = async () => {
  if (existsSync(DOCKER_COMPOSE_FILENAME)) {
    return;
  }

  const {image}: {image: string} = await prompts({
    type: 'select',
    name: 'image',
    message: 'What kind of emulator would you like to run locally?',
    choices: [
      {
        title: `Full experience — closest to production, including Console, UI, and well known services`,
        value: `skylab`
      },
      {title: `Lightweight environment — minimal setup without any UI`, value: `satellite`}
    ]
  });

  assertAnswerCtrlC(image);

  const template = await readTemplateFile({
    template: `docker-compose.${image}.yml`,
    sourceFolder: TEMPLATE_PATH
  });

  const readConfig = image === 'satellite' ? junoDevConfigFile : junoConfigFile;
  const {configPath} = readConfig();
  const configFile = basename(configPath);

  const content = template
    .replaceAll('<JUNO_DEV_CONFIG>', configFile)
    .replaceAll('<JUNO_CONFIG>', configFile);

  await writeFile(join(DESTINATION_PATH, DOCKER_COMPOSE_FILENAME), content, 'utf-8');
};

const assertAndInitConfig = async () => {
  await assertDockerCompose();

  const dockerCompose = await readFile(DOCKER_COMPOSE_FILENAME, 'utf-8');
  const isSkylab = /image:\s*junobuild\/skylab(:[^\s]*)?/.test(dockerCompose);

  if (isSkylab) {
    await assertJunoConfig();
    return;
  }

  await assertJunoDevConfig();
};
