import {HttpAgent} from '@dfinity/agent';
import {nonNullish} from '@junobuild/utils';
import {actorParameters} from './actor.api';

export const initAgent = async (): Promise<HttpAgent> => {
  const {identity, container, fetch} = await actorParameters();

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
};
