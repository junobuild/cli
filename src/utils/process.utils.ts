import {hasArgs} from '@junobuild/cli-tools';
import {type JsonnableEd25519KeyIdentity} from '../types/identity';

export const getProcessToken = (): JsonnableEd25519KeyIdentity | undefined => {
  const envToken = process.env.JUNO_TOKEN;

  if (envToken === undefined) {
    return undefined;
  }

  try {
    const {token} = JSON.parse(atob(envToken));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return token;
  } catch (_err: unknown) {
    throw new Error('Cannot parse token provided as an environment variable.');
  }
};

const isProcessToken = (): boolean => getProcessToken() !== undefined;

export const isHeadless = (): boolean => {
  if (isProcessToken()) {
    return true;
  }

  const [_, ...args] = process.argv.slice(2);
  return hasArgs({args, options: ['--headless']});
};

export const isNotHeadless = (): boolean => !isHeadless();
