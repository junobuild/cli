import {type PrincipalText} from '@dfinity/zod-schemas';
import Conf from 'conf';
import {ENV} from '../env';
import {type CliState, type CliStateSatellite} from '../types/cli.state';

export const getStateConfig = (): Conf<CliState> =>
  new Conf<CliState>({projectName: ENV.config.projectStateName});

export const saveLastAppliedConfig = ({
  satelliteId,
  lastAppliedConfig
}: {satelliteId: PrincipalText} & Pick<CliStateSatellite, 'lastAppliedConfig'>) => {
  const config = getStateConfig();

  const satellites = config.get('satellites');

  const updateSatellites = {
    ...(satellites ?? {}),
    [satelliteId]: {lastAppliedConfig}
  };

  config.set('satellites', updateSatellites);
};
