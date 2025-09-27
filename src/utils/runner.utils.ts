import {notEmptyString} from '@dfinity/utils';
import {spawn} from '@junobuild/cli-tools';
import {type EmulatorRunner} from '@junobuild/config';
import {green, red, yellow} from 'kleur';
import {lt} from 'semver';
import {DOCKER_MIN_VERSION} from '../constants/dev.constants';
import type {CliEmulatorDerivedConfig} from '../types/emulator';

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
    // container does not support ps
    // Reference: https://github.com/apple/container/pull/299
    const args = runner === 'container' ? ['ls', '--quiet'] : ['ps', '--quiet'];

    await spawn({
      command: runner,
      args,
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
}: Pick<CliEmulatorDerivedConfig, 'runner' | 'containerName'>): Promise<
  {exist: boolean} | {err: unknown}
> => {
  try {
    let output = '';

    const args =
      runner === 'container' ? ['ls', '-aq'] : ['ps', '-aq', '-f', `name=^/${containerName}$`];

    await spawn({
      command: runner,
      args,
      stdout: (o) => (output += o),
      silentOut: true
    });

    if (runner === 'container') {
      const exist = output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(notEmptyString)
        .some((name) => name === containerName);

      return {exist};
    }

    return {exist: output.trim().length > 0};
  } catch (err: unknown) {
    return {err};
  }
};

export const hasExistingVolume = async ({
  volume,
  runner
}: Pick<CliEmulatorDerivedConfig, 'runner'> & Required<Pick<EmulatorRunner, 'volume'>>): Promise<
  {exist: boolean} | {err: unknown}
> => {
  try {
    let output = '';

    const args =
      runner === 'container'
        ? ['volume', 'ls', '-q']
        : ['volume', 'ls', '-q', '-f', `name=^${volume}$`];

    await spawn({
      command: runner,
      args,
      stdout: (o) => (output += o),
      silentOut: true
    });

    if (runner === 'container') {
      const exist = output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(notEmptyString)
        .some((name) => name === volume);

      return {exist};
    }

    return {exist: output.trim().length > 0};
  } catch (err: unknown) {
    return {err};
  }
};

export const isContainerRunning = async ({
  containerName,
  runner
}: Pick<CliEmulatorDerivedConfig, 'runner' | 'containerName'>): Promise<
  {running: boolean} | {err: unknown}
> => {
  try {
    let output = '';

    const args =
      runner === 'container'
        ? ['ls', '--quiet']
        : ['ps', '--quiet', '-f', `name=^/${containerName}$`];

    await spawn({
      command: runner,
      args,
      stdout: (o) => (output += o),
      silentOut: true
    });

    if (runner === 'container') {
      const running = output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(notEmptyString)
        .some((name) => name === containerName);

      return {running};
    }

    return {running: output.trim().length > 0};
  } catch (err: unknown) {
    return {err};
  }
};
