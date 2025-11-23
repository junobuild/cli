import {spawn} from '@junobuild/cli-tools';
import {green, yellow} from 'kleur';
import {lt, major} from 'semver';
import {NODE_VERSION} from '../constants/constants';
import {IC_WASM_MIN_VERSION, RUST_MIN_VERSION} from '../constants/dev.constants';

export const checkNodeVersion = (): {valid: boolean | 'error'} => {
  try {
    const {version} = process;
    const nodeMajor = major(version);

    if (nodeMajor < NODE_VERSION) {
      console.log(
        `Your version of Node is ${yellow(version.trim())}. Juno CLI requires Node ${green(
          `${NODE_VERSION}`
        )} or a more recent version.`
      );
      return {valid: false};
    }
  } catch (_e: unknown) {
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
          RUST_MIN_VERSION
        )} or a more recent version.`
      );
      return {valid: false};
    }
  } catch (_e: unknown) {
    console.error(`Cannot detect your Rust version. Is Cargo installed on your machine?`);
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
          IC_WASM_MIN_VERSION
        )} or a more recent version.`
      );
      return {valid: false};
    }
  } catch (_e: unknown) {
    return {valid: 'error'};
  }

  return {valid: true};
};

export const checkToolInstalled = async ({
  command,
  args
}: {
  command: string;
  args?: readonly string[];
}): Promise<{valid: boolean | 'error'}> => {
  try {
    await spawn({
      command,
      args,
      silentOut: true
    });

    return {valid: true};
  } catch (_e: unknown) {
    return {valid: 'error'};
  }
};
