import Conf, {type Schema} from 'conf';
import {CLI_SETTINGS_NAME} from '../constants/constants';

export interface CliSettingsConfig {
  encryption: boolean;
}

const schema: Schema<CliSettingsConfig> = {
  encryption: {
    type: 'boolean'
  }
} as const;

export const getSettingsConfig = (): Conf<CliSettingsConfig> =>
  new Conf<CliSettingsConfig>({projectName: CLI_SETTINGS_NAME, schema});

export const saveEncryption = (encryption: boolean) => {
  getSettingsConfig().set('encryption', encryption);
};
