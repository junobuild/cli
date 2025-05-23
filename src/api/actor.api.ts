import {Ed25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';
import {isNullish, nonNullish} from '@dfinity/utils';
import {type ActorParameters} from '@junobuild/admin';
import {red} from 'kleur';
import {getToken} from '../configs/cli.config';
import {getProcessToken} from '../utils/process.utils';
import {initAgent} from './agent.api';

export const actorParameters = async (): Promise<
  Omit<ActorParameters, 'agent'> & Required<Pick<ActorParameters, 'agent'>>
> => {
  const token = getProcessToken() ?? (await getToken());

  if (isNullish(token)) {
    console.log(`${red('No controller found.')} Are you logged in?`);
    process.exit(1);
  }

  const identity = Ed25519KeyIdentity.fromParsedJson(token);

  const params: Omit<ActorParameters, 'agent'> = {
    identity,
    ...(nonNullish(process.env.CONTAINER_URL) && {container: process.env.CONTAINER_URL})
  };

  const agent = await initAgent(params);

  return {
    ...params,
    agent
  };
};
