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
}): CliStateSatelliteAppliedConfigHashes | undefined => {
  console.log('____>', getStateConfig().get('satellites'));
  return getStateConfig().get('satellites')?.[satelliteId]?.lastAppliedConfig;
};

export const saveLastAppliedConfig = ({
  satelliteId,
  lastAppliedConfig: {storage, datastore, auth, settings}
}: {satelliteId: PrincipalText} & Pick<CliStateSatellite, 'lastAppliedConfig'>) => {
  const config = getStateConfig();

  console.log('1.', config);

  const satellites = config.get('satellites');

  console.log('2.', satellites);

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

  console.log('///>', satelliteId, updateSatellites);

  config.set('satellites', updateSatellites);
};
