import {magenta} from 'kleur';
import {existsSync} from 'node:fs';
import {execute} from '../utils/cmd.utils';
import {assertDockerRunning, checkDockerVersion} from '../utils/env.utils';
import {copyTemplateFile} from '../utils/fs.utils';
import {confirmAndExit} from '../utils/prompt.utils';

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
  if (existsSync('juno.dev.json')) {
    return;
  }

  await confirmAndExit(
    `A config file is required for development. Would you like the CLI to create a default ${magenta(
      'juno.dev.json'
    )} for you?`
  );

  await copyTemplateFile({
    template: 'juno.dev.json',
    sourceFolder: TEMPLATE_PATH,
    destinationFolder: DESTINATION_PATH
  });
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

  await copyTemplateFile({
    template: 'docker-compose.yml',
    sourceFolder: TEMPLATE_PATH,
    destinationFolder: DESTINATION_PATH
  });
};