import {CLI_SETTINGS_NAME} from '../constants/constants';
// TODO: fix TypeScript declaration import of conf
// @ts-expect-error
import Conf, {type Schema} from 'conf';
import type {CliProfile} from '../types/cli.config';

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

export const saveEncryption = (encryption: boolean): CliProfile | undefined =>
  getSettingsConfig().set('encryption', encryption);
