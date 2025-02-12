import {isNullish, nonNullish} from '@dfinity/utils';
import {
  type CliSettingsConfig,
  getSettingsConfig,
  saveEncryption
} from '../configs/cli.settings.config';
import {confirm} from '../utils/prompt.utils';
// TODO: fix TypeScript declaration import of conf
// @ts-expect-error
import type Conf from 'conf';
import {yellow} from 'kleur';
import {askForPassword} from '../services/cli.settings.services';
import {loadConfig} from '../utils/config.utils';
import {isHeadless} from '../utils/process.utils';

class SettingsStore {
  readonly #config: Conf<CliSettingsConfig>;

  private constructor(readonly config: Conf<CliSettingsConfig>) {
    this.#config = config;
  }

  static async init(): Promise<SettingsStore> {
    const store = new SettingsStore(getSettingsConfig());

    if (isHeadless()) {
      return store;
    }

    if (nonNullish(store.config.get('encryption'))) {
      return store;
    }

    const encryption = await confirm(
      'Do you want to encrypt the CLI configuration file for added security?'
    );

    saveEncryption(encryption);

    if (encryption) {
      await store.migrateConfig();
    }

    return store;
  }

  isEncryptionEnabled(): boolean {
    return this.#config.get('encryption');
  }

  private async migrateConfig() {
    try {
      const config = loadConfig(undefined);

      // We load a config object that contains no entries, therefore there is no configuration to migrate.
      if (isNullish(config.store) || config.size === 0) {
        return;
      }

      const pwd = await askForPassword(
        'Please provide a password to encrypt your CLI configuration file'
      );

      // Save with encryption.
      const configEncoded = loadConfig(pwd);
      configEncoded.store = config.store;
    } catch (err: unknown) {
      console.log(
        `${yellow('Your current configuration cannot be encrypted. Maybe it is already encrypted?')}`
      );
      console.log(err);
    }
  }
}

export const settingsStore: SettingsStore = await SettingsStore.init();
