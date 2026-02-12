import {hasArgs} from '@junobuild/cli-tools';
import {EnvToken} from '../env.token';

export const isHeadless = async (): Promise<boolean> => {
  const {isDefined} = await EnvToken.getInstance();

  if (isDefined()) {
    return true;
  }

  const [_, ...args] = process.argv.slice(2);
  return hasArgs({args, options: ['--headless']});
};

export const isNotHeadless = async (): Promise<boolean> => !(await isHeadless());
