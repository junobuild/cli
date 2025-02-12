import {assertNonNullish} from '@dfinity/utils';
import {junoConfigExist, readJunoConfig} from '../../configs/juno.config';
import type {AssetKey} from '../../types/asset-key';
import {configEnv} from '../../utils/config.utils';
import {consoleNoConfigFound} from '../../utils/msg.utils';
import {satelliteParameters} from '../../utils/satellite.utils';
import {createSnapshot, deleteSnapshot, restoreSnapshot} from './backup.services';

export const createSnapshotSatellite = async (params: {args?: string[]}) => {
  await executeBackupFn({
    ...params,
    fn: createSnapshot
  });
};

export const restoreSnapshotSatellite = async (params: {args?: string[]}) => {
  await executeBackupFn({
    ...params,
    fn: restoreSnapshot
  });
};

export const deleteSnapshotSatellite = async (params: {args?: string[]}) => {
  await executeBackupFn({
    ...params,
    fn: deleteSnapshot
  });
};

const executeBackupFn = async ({
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
  const env = configEnv(args);
  const {satellite: satelliteConfig} = await readJunoConfig(env);

  const satellite = await satelliteParameters({satellite: satelliteConfig, env});
  const {satelliteId} = satellite;

  // TS guard. satelliteParameters exit if satelliteId is undefined.
  assertNonNullish(satelliteId);

  return satelliteId;
};
