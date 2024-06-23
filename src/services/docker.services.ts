import {execute} from '@junobuild/cli-tools';
import type {PartialConfigFile} from '@junobuild/config-loader';
import {nonNullish} from '@junobuild/utils';
import {magenta} from 'kleur';
import {existsSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {
  detectJunoDevConfigType,
  junoDevConfigExist,
  junoDevConfigFile
} from '../configs/juno.dev.config';
import {JUNO_DEV_CONFIG_FILENAME} from '../constants/constants';
import {assertDockerRunning, checkDockerVersion} from '../utils/env.utils';
import {copyTemplateFile, readTemplateFile} from '../utils/fs.utils';
import {confirmAndExit} from '../utils/prompt.utils';
import {promptConfigType} from './init.services';

const TEMPLATE_PATH = '../templates/docker';
const DESTINATION_PATH = process.cwd();

export const start = async () => {
  const {valid} = await checkDockerVersion();

  if (valid === 'error' || !valid) {
    return;
  }

  await assertDockerRunning();

  await assertJunoDevConfig();
  await assertDockerCompose();

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

  const {configType, configPath} = await buildConfigType();

  await copyTemplateFile({
    template: `${JUNO_DEV_CONFIG_FILENAME}.${configType}`,
    sourceFolder: TEMPLATE_PATH,
    destinationFolder: DESTINATION_PATH,
    ...(nonNullish(configPath) && {destinationFilename: configPath})
  });
};

const buildConfigType = async (): Promise<PartialConfigFile> => {
  // We try to automatically detect if we should create a TypeScript or JavaScript (mjs) configuration.
  const detectedConfig = detectJunoDevConfigType();

  if (nonNullish(detectedConfig)) {
    return detectedConfig;
  }

  const configType = await promptConfigType();

  return {configType};
};

const assertDockerCompose = async () => {
  if (existsSync('docker-compose.yml')) {
    return;
  }

  await confirmAndExit(
    `The CLI utilizes Docker Compose, which is handy for customizing configurations. Would you like the CLI to generate a default ${magenta(
      'docker-compose.yml'
    )} file for you?`
  );

  const {configType} = junoDevConfigFile();

  const template = await readTemplateFile({
    template: 'docker-compose.yml',
    sourceFolder: TEMPLATE_PATH
  });

  const configFile = `${JUNO_DEV_CONFIG_FILENAME}.${configType}`;

  const content = template.replaceAll('<JUNO_DEV_CONFIG>', configFile);

  await writeFile(join(DESTINATION_PATH, 'docker-compose.yml'), content, 'utf-8');
};
