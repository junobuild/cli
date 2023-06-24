import {Ed25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';
import {ActorParameters} from '@junobuild/admin';
import fetch from 'node-fetch';
import {getToken} from './auth.config.utils';
import {getProcessToken} from './process.utils';

export const actorParameters = (): ActorParameters => {
  const token = getProcessToken() ?? getToken();

  if (!token) {
    throw new Error('No controller found. Are you logged in?');
  }

  const identity = Ed25519KeyIdentity.fromParsedJson(token);

  return {
    identity,
    // TODO: TypeScript incompatibility window.fetch vs nodejs.fetch vs agent-ts using typeof fetch
    // @ts-ignore
    fetch,
    env: process.env.NODE_ENV === 'development' ? 'dev' : 'prod'
  };
};
