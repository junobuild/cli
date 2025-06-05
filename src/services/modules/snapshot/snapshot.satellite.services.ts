import {assertNonNullish} from '@dfinity/utils';
import {junoConfigExist} from '../../../configs/juno.config';
import type {AssetKey} from '../../../types/asset-key';
import {consoleNoConfigFound} from '../../../utils/msg.utils';
import {assertConfigAndLoadSatelliteContext} from '../../../utils/satellite.utils';
import {createSnapshot, deleteSnapshot, restoreSnapshot} from './snapshot.services';

export const createSnapshotSatellite = async () => {
  await executeSnapshotFn({
    fn: createSnapshot
  });
};

export const restoreSnapshotSatellite = async () => {
  await executeSnapshotFn({
    fn: restoreSnapshot
  });
};

export const deleteSnapshotSatellite = async () => {
  await executeSnapshotFn({
    fn: deleteSnapshot
  });
};

const executeSnapshotFn = async ({
  fn
}: {
  fn: (params: {canisterId: string; segment: AssetKey}) => Promise<void>;
}) => {
  if (!(await junoConfigExist())) {
    consoleNoConfigFound();
    return;
  }

  const satelliteId = await loadSatelliteId();

  await fn({
    canisterId: satelliteId,
    segment: 'satellite'
  });
};

const loadSatelliteId = async (): Promise<string> => {
  const {satellite} = await assertConfigAndLoadSatelliteContext();
  const {satelliteId} = satellite;

  // TS guard. satelliteParameters exit if satelliteId is undefined.
  assertNonNullish(satelliteId);

  return satelliteId;
};
