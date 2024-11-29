import {getCliOrbiters} from '../../configs/cli.config';
import {createSnapshot} from './backup.services';

export const createSnapshotOrbiter = async ({args}: {args?: string[]}) => {
  const authOrbiters = await getCliOrbiters();

  if (authOrbiters === undefined || authOrbiters.length === 0) {
    return;
  }

  for (const orbiter of authOrbiters) {
    await createSnapshot({
      canisterId: orbiter.p,
      segment: 'orbiter'
    });
  }
};
