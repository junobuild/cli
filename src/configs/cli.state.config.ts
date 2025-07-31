import {type PrincipalText} from '@dfinity/zod-schemas';
import Conf from 'conf';
import {ENV} from '../env';
import {
  type CliState,
  type CliStateSatellite,
  type CliStateSatelliteAppliedConfigHashes
} from '../types/cli.state';

export const getStateConfig = (): Conf<CliState> =>
  new Conf<CliState>({projectName: ENV.config.projectStateName});

export const getLatestAppliedConfig = ({
  satelliteId
}: {
  satelliteId: PrincipalText;
}): CliStateSatelliteAppliedConfigHashes | undefined =>
  getStateConfig().get('satellites')?.[satelliteId]?.lastAppliedConfig;

export const saveLastAppliedConfig = ({
  satelliteId,
  lastAppliedConfig: {storage, datastore, auth, settings}
}: {satelliteId: PrincipalText} & Pick<CliStateSatellite, 'lastAppliedConfig'>) => {
  const config = getStateConfig();

  const satellites = config.get('satellites');

  const lastAppliedConfig = satellites?.[satelliteId]?.lastAppliedConfig;

  const updateSatellites = {
    ...(satellites ?? {}),
    [satelliteId]: {
      lastAppliedConfig: {
        storage: storage ?? lastAppliedConfig?.storage,
        datastore: datastore ?? lastAppliedConfig?.datastore,
        auth: auth ?? lastAppliedConfig?.auth,
        settings: settings ?? lastAppliedConfig?.settings
      }
    }
  };

  config.set('satellites', updateSatellites);
};
