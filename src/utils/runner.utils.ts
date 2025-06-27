import {spawn} from '@junobuild/cli-tools';
import {green, red, yellow} from 'kleur';
import {lt} from 'semver';
import {DOCKER_MIN_VERSION} from '../constants/dev.constants';
import {CliEmulatorDerivedConfig} from '../types/emulator';

export const checkDockerVersion = async (): Promise<{valid: boolean | 'error'}> => {
  try {
    let output = '';
    await spawn({
      command: 'docker',
      args: ['--version'],
      stdout: (o) => (output += o)
    });

    const version = output.replaceAll(',', '').trim().split(' ')[2];

    if (lt(version, DOCKER_MIN_VERSION)) {
      console.log(
        `Your version of Docker is ${yellow(version.trim())}. Juno CLI requires ${green(
          DOCKER_MIN_VERSION
        )} or a more recent version.`
      );
      return {valid: false};
    }
  } catch (_e: unknown) {
    console.log(`${red('Cannot detect Docker version.')} Is Docker installed on your machine?`);
    return {valid: 'error'};
  }

  return {valid: true};
};

export const assertContainerRunnerRunning = async ({
  runner
}: Pick<CliEmulatorDerivedConfig, 'runner'>) => {
  try {
    await spawn({
      command: runner,
      args: ['ps', '--quiet'],
      silentOut: true
    });
  } catch (_e: unknown) {
    console.log(red(`It looks like ${runner} does not appear to be running.`));
    process.exit(1);
  }
};

export const hasExistingContainer = async ({
  containerName,
  runner
}: CliEmulatorDerivedConfig): Promise<{exist: boolean} | {err: unknown}> => {
  try {
    let output = '';
    await spawn({
      command: runner,
      args: ['ps', '-aq', '-f', `name=^/${containerName}$`],
      stdout: (o) => (output += o),
      silentOut: true
    });

    return {exist: output.trim().length > 0};
  } catch (err: unknown) {
    return {err};
  }
};

export const isContainerRunning = async ({
  containerName,
  runner
}: CliEmulatorDerivedConfig): Promise<{running: boolean} | {err: unknown}> => {
  try {
    let output = '';
    await spawn({
      command: runner,
      args: ['ps', '--quiet', '-f', `name=^/${containerName}$`],
      stdout: (o) => (output += o),
      silentOut: true
    });

    return {running: output.trim().length > 0};
  } catch (err: unknown) {
    return {err};
  }
};
