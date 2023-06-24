import type {JsonnableEd25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';

export const getProcessToken = (): JsonnableEd25519KeyIdentity | undefined => {
  const envToken = process.env.JUNO_TOKEN;

  if (envToken === undefined) {
    return undefined;
  }

  try {
    const {token} = JSON.parse(atob(envToken));
    return token;
  } catch (err: unknown) {
    throw new Error('Cannot parse token provided as an environment variable.');
  }
};

export const isProcessToken = (): boolean => getProcessToken() !== undefined;
