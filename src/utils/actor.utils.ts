import {HttpAgent} from '@dfinity/agent';
import {Ed25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';
import {type ActorParameters} from '@junobuild/admin';
import {isNullish, nonNullish} from '@junobuild/utils';
import {red} from 'kleur';
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
    fetch,
    ...(nonNullish(process.env.CONTAINER_URL) && {container: process.env.CONTAINER_URL})
  };
};

export const initAgent = async (): Promise<HttpAgent> => {
  const {identity, container, fetch} = actorParameters();

  const localActor = nonNullish(container) && container !== false;

  const host = localActor
    ? container === true
      ? 'http://127.0.0.1:5987'
      : container
    : 'https://icp-api.io';

  const agent = new HttpAgent({identity, host, retryTimes: 10, fetch});

  if (localActor) {
    // Fetch root key for certificate validation during development
    await agent.fetchRootKey();
  }

  return agent;
};
