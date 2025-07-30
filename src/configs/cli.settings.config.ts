import Conf, {type Schema} from 'conf';
import {ENV} from '../env';
import {type CliSettingsConfig} from '../types/cli.settings.config';

const schema: Schema<CliSettingsConfig> = {
  encryption: {
    type: 'boolean'
  }
} as const;

export const getSettingsConfig = (): Conf<CliSettingsConfig> =>
  new Conf<CliSettingsConfig>({projectName: ENV.config.projectSettingsName, schema});

export const saveEncryption = (encryption: boolean) => {
  getSettingsConfig().set('encryption', encryption);
};
