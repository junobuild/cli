import {Ed25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';
import {type ActorParameters} from '@junobuild/admin';
import {isNullish, nonNullish} from '@junobuild/utils';
import {red} from 'kleur';
import fetch from 'node-fetch';
import {getToken} from '../configs/cli.config';
import {REVOKED_CONTROLLERS} from '../constants/constants';
import {getProcessToken} from './process.utils';

export const actorParameters = (): ActorParameters => {
  const token = getProcessToken() ?? getToken();

  if (isNullish(token)) {
    console.log(`${red('No controller found.')} Are you logged in?`);
    process.exit(1);
  }

  const identity = Ed25519KeyIdentity.fromParsedJson(token);

  if (REVOKED_CONTROLLERS.includes(identity.getPrincipal().toText())) {
    throw new Error('The controller has been revoked for security reason!');
  }

  return {
    identity,
    // TODO: TypeScript incompatibility window.fetch vs nodejs.fetch vs agent-ts using typeof fetch
    // @ts-expect-error
    fetch,
    ...(nonNullish(process.env.CONTAINER_URL) && {container: process.env.CONTAINER_URL})
  };
};
