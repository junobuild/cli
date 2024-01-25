import {magenta} from 'kleur';
import {existsSync} from 'node:fs';
import {execute} from '../utils/cmd.utils';
import {checkDockerVersion} from '../utils/env.utils';
import {copyTemplateFile} from '../utils/fs.utils';
import {confirmAndExit} from '../utils/prompt.utils';

const TEMPLATE_PATH = '../templates/docker';
const DESTINATION_PATH = '.';

export const start = async () => {
  const {valid} = await checkDockerVersion();

  if (valid === 'error') {
    console.error(`Cannot detect Docker version. Is Docker installed on your machine?`);
    return;
  }

  if (!valid) {
    return;
  }

  await assertJunoDevConfig();
  await assertDockerCompose();

  await execute({
    command: 'docker',
    args: ['compose', 'up']
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
