import {green, yellow} from 'kleur';
import {major} from 'semver';
import {NODE_LTS} from '../constants/constants';

export const checkNodeVersion = (): {valid: boolean} => {
  try {
    const {version} = process;
    const nodeMajor = major(version);

    if (nodeMajor < NODE_LTS) {
      console.log(
        `Your version of Node is ${yellow(`${version}`)}. Juno CLI requires Node ${green(
          `${NODE_LTS}.x`
        )} LTS.`
      );
      return {valid: false};
    }
  } catch (e) {
    console.error(`Cannot detect your Node runtime version. Is NodeJS installed on your machine?`);
    return {valid: false};
  }

  return {valid: true};
};
