import Conf, {type Schema} from 'conf';
import {ENV} from '../env';
import {type CliSettings} from '../types/cli.settings';

const schema: Schema<CliSettings> = {
  encryption: {
    type: 'boolean'
  }
} as const;

export const getSettingsConfig = (): Conf<CliSettings> =>
  new Conf<CliSettings>({projectName: ENV.config.projectSettingsName, schema});

export const saveEncryption = (encryption: boolean) => {
  getSettingsConfig().set('encryption', encryption);
};
