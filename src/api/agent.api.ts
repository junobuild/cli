import {HttpAgent} from '@dfinity/agent';
import type {ActorParameters} from '@junobuild/admin';
import {isNullish, nonNullish} from '@junobuild/utils';
import {REVOKED_CONTROLLERS} from '../constants/constants';
import {actorParameters} from './actor.api';

export class AgentApi {
  #agents: Record<string, HttpAgent> | undefined = undefined;

  async getAgent({identity, ...rest}: Omit<ActorParameters, 'agent'>): Promise<HttpAgent> {
    const key = identity.getPrincipal().toText();

    if (isNullish(this.#agents) || isNullish(this.#agents[key])) {
      const agent = await this.createAgent({identity, ...rest});

      this.#agents = {
        ...(this.#agents ?? {}),
        [key]: agent
      };

      return agent;
    }

    return this.#agents[key];
  }

  private async createAgent({identity, container, fetch}: ActorParameters): Promise<HttpAgent> {
    const localActor = nonNullish(container) && container !== false;

    const host = localActor
      ? container === true
        ? 'http://127.0.0.1:5987'
        : container
      : 'https://icp-api.io';

    return await HttpAgent.create({
      identity,
      host,
      retryTimes: 10,
      fetch,
      shouldFetchRootKey: localActor
    });
  }
}

const agent = new AgentApi();

export const initAgent = async (params?: Omit<ActorParameters, 'agent'>): Promise<HttpAgent> => {
  const {identity, ...rest} = params ?? (await actorParameters());

  if (REVOKED_CONTROLLERS.includes(identity.getPrincipal().toText())) {
    throw new Error('The controller has been revoked for security reason!');
  }

  return await agent.getAgent({identity, ...rest});
};
