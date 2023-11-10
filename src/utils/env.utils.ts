import {green, yellow} from 'kleur';
import {major} from 'semver';
import {NODE_18} from '../constants/constants';

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
