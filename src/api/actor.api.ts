import {Ed25519KeyIdentity} from '@dfinity/identity/lib/cjs/identity/ed25519';
import {isNullish, nonNullish} from '@dfinity/utils';
import type {ActorParameters} from '@junobuild/ic-client/actor';
import {green, red} from 'kleur';
import {getToken} from '../configs/cli.config';
import {ENV} from '../env';
import {getProcessToken} from '../utils/process.utils';
import {NEW_CMD_LINE} from '../utils/prompt.utils';
import {initAgent} from './agent.api';

export const actorParameters = async (): Promise<
  Omit<ActorParameters, 'agent'> & Required<Pick<ActorParameters, 'agent'>>
> => {
  const token = getProcessToken() ?? (await getToken());

  if (isNullish(token)) {
    console.log(`${red(`No access key found for ${ENV.mode}.`)} Are you logged in?`);

    if (ENV.mode !== 'production') {
      console.log(
        `${NEW_CMD_LINE}💡 To enforce separation of concerns and security, each mode requires a separate login — for example: ${green(`juno login --mode ${ENV.mode}`)}`
      );
    }

    process.exit(1);
  }

  const identity = Ed25519KeyIdentity.fromParsedJson(token);

  const params: Omit<ActorParameters, 'agent'> = {
    identity,
    ...(nonNullish(ENV.containerUrl) && {container: ENV.containerUrl})
  };

  const agent = await initAgent(params);

  return {
    ...params,
    agent
  };
};
