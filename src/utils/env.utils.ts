import {green, yellow} from 'kleur';
import {lt, major} from 'semver';
import {NODE_18, RUST_MIN_VERSION} from '../constants/constants';
import {spawn} from './cmd.utils';

export const checkNodeVersion = (): {valid: boolean} => {
  try {
    const {version} = process;
    const nodeMajor = major(version);

    if (nodeMajor < NODE_18) {
      console.log(
        `Your version of Node is ${yellow(`${version}`)}. Juno CLI requires Node ${green(
          `${NODE_18}`
        )} or a more recent version.`
      );
      return {valid: false};
    }
  } catch (e) {
    console.error(`Cannot detect your Node runtime version. Is NodeJS installed on your machine?`);
    return {valid: false};
  }

  return {valid: true};
};

export const checkRustVersion = async (): Promise<{valid: boolean}> => {
  try {
    let output = '';
    await spawn({
      command: 'rustc',
      args: ['--version'],
      stdout: (o) => (output += o)
    });

    const version = output.split(' ')[1];

    if (lt(version, RUST_MIN_VERSION)) {
      console.log(
        `Your version of Rustc is ${yellow(`${version}`)}. Juno CLI requires ${green(
          `${RUST_MIN_VERSION}`
        )} or a more recent version.`
      );
      return {valid: false};
    }
  } catch (e) {
    console.error(`Cannot detect your Rust runtime version. Is Cargo installed on your machine?`);
    return {valid: false};
  }

  return {valid: true};
};
