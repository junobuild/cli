import {hasArgs} from '@junobuild/cli-tools';
import {EnvIdentity} from '../env.identity';

export const isHeadless = async (): Promise<boolean> => {
  const {hasCredentials} = await EnvIdentity.getInstance();

  if (hasCredentials()) {
    return true;
  }

  const [_, ...args] = process.argv.slice(2);
  return hasArgs({args, options: ['--headless']});
};

export const isNotHeadless = async (): Promise<boolean> => !(await isHeadless());
