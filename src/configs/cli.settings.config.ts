import Conf, {type Schema} from 'conf';
import {ENV} from '../env';

export interface CliSettingsConfig {
  encryption: boolean;
}

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
