import {assertNonNullish} from '@dfinity/utils';
import {junoConfigExist} from '../../../configs/juno.config';
import type {AssetKey} from '../../../types/asset-key';
import {consoleNoConfigFound} from '../../../utils/msg.utils';
import {assertConfigAndLoadSatelliteContext} from '../../../utils/satellite.utils';
import {createSnapshot, deleteSnapshot, restoreSnapshot} from './snapshot.services';

export const createSnapshotSatellite = async (params: {args?: string[]}) => {
  await executeSnapshotFn({
    ...params,
    fn: createSnapshot
  });
};

export const restoreSnapshotSatellite = async (params: {args?: string[]}) => {
  await executeSnapshotFn({
    ...params,
    fn: restoreSnapshot
  });
};

export const deleteSnapshotSatellite = async (params: {args?: string[]}) => {
  await executeSnapshotFn({
    ...params,
    fn: deleteSnapshot
  });
};

const executeSnapshotFn = async ({
  args,
  fn
}: {
  args?: string[];
  fn: (params: {canisterId: string; segment: AssetKey}) => Promise<void>;
}) => {
  if (!(await junoConfigExist())) {
    consoleNoConfigFound();
    return;
  }

  const satelliteId = await loadSatelliteId({args});

  await fn({
    canisterId: satelliteId,
    segment: 'satellite'
  });
};

const loadSatelliteId = async ({args}: {args?: string[]}): Promise<string> => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);
  const {satelliteId} = satellite;

  // TS guard. satelliteParameters exit if satelliteId is undefined.
  assertNonNullish(satelliteId);

  return satelliteId;
};
