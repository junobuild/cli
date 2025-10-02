import {assertNonNullish} from '@dfinity/utils';
import {noJunoConfig} from '../../../configs/juno.config';
import type {AssetKey} from '../../../types/asset-key';
import {consoleNoConfigFound} from '../../../utils/msg.utils';
import {assertConfigAndLoadSatelliteContext} from '../../../utils/satellite.utils';
import {
  createSnapshot,
  deleteSnapshot,
  downloadSnapshot,
  restoreSnapshot,
  uploadSnapshot
} from './snapshot.services';

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

export const downloadSnapshotSatellite = async () => {
  await executeSnapshotFn({
    fn: downloadSnapshot
  });
};

export const uploadSnapshotSatellite = async (args?: string[]) => {
  await executeSnapshotFn({
    fn: (params) => uploadSnapshot({...params, args}),
  });
};

const executeSnapshotFn = async ({
  fn
}: {
  fn: (params: {canisterId: string; segment: AssetKey}) => Promise<void>;
}) => {
  if (await noJunoConfig()) {
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
