import {Ed25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';
import {ActorParameters} from '@junobuild/admin';
import fetch from 'node-fetch';
import {getToken} from './auth.config.utils';

export const actorParameters = (): ActorParameters => {
  const identity = Ed25519KeyIdentity.fromParsedJson(getToken());

  return {
    identity,
    // TODO: TypeScript incompatibility window.fetch vs nodejs.fetch vs agent-ts using typeof fetch
    // @ts-ignore
    fetch
  };
};
