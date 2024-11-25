import {ICManagementCanister} from '@dfinity/ic-management';
import type {Principal} from '@dfinity/principal';
import {initAgent} from '../utils/actor.utils';

export const canisterStop = async ({canisterId}: {canisterId: Principal}): Promise<void> => {
  const agent = await initAgent();

  const {stopCanister} = ICManagementCanister.create({
    agent
  });

  await stopCanister(canisterId);
};

export const canisterStart = async ({canisterId}: {canisterId: Principal}): Promise<void> => {
  const agent = await initAgent();

  const {startCanister} = ICManagementCanister.create({
    agent
  });

  await startCanister(canisterId);
};
