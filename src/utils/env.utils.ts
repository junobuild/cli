import {green, yellow} from 'kleur';
import {lt, major} from 'semver';
import {
  DOCKER_MIN_VERSION,
  IC_WASM_MIN_VERSION,
  NODE_18,
  RUST_MIN_VERSION
} from '../constants/constants';
import {spawn} from './cmd.utils';

export const checkNodeVersion = (): {valid: boolean | 'error'} => {
  try {
    const {version} = process;
    const nodeMajor = major(version);

    if (nodeMajor < NODE_18) {
      console.log(
        `Your version of Node is ${yellow(`${version.trim()}`)}. Juno CLI requires Node ${green(
          `${NODE_18}`
        )} or a more recent version.`
      );
      return {valid: false};
    }
  } catch (e: unknown) {
    return {valid: 'error'};
  }

  return {valid: true};
};

export const checkRustVersion = async (): Promise<{valid: boolean | 'error'}> => {
  try {
    let output = '';
    await spawn({
      command: 'rustc',
      args: ['--version'],
      stdout: (o) => (output += o)
    });

    const version = output.trim().split(' ')[1];

    if (lt(version, RUST_MIN_VERSION)) {
      console.log(
        `Your version of Rustc is ${yellow(version.trim())}. Juno CLI requires ${green(
          `${RUST_MIN_VERSION}`
        )} or a more recent version.`
      );
      return {valid: false};
    }
  } catch (e: unknown) {
    return {valid: 'error'};
  }

  return {valid: true};
};

export const checkIcWasmVersion = async (): Promise<{valid: boolean | 'error'}> => {
  try {
    let output = '';
    await spawn({
      command: 'ic-wasm',
      args: ['--version'],
      stdout: (o) => (output += o)
    });

    const version = output.trim().split(' ')[1];

    if (lt(version, IC_WASM_MIN_VERSION)) {
      console.log(
        `Your version of ic-wasm is ${yellow(version.trim())}. Juno CLI requires ${green(
          `${IC_WASM_MIN_VERSION}`
        )} or a more recent version.`
      );
      return {valid: false};
    }
  } catch (e: unknown) {
    return {valid: 'error'};
  }

  return {valid: true};
};

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
          `${DOCKER_MIN_VERSION}`
        )} or a more recent version.`
      );
      return {valid: false};
    }
  } catch (e: unknown) {
    return {valid: 'error'};
  }

  return {valid: true};
};
