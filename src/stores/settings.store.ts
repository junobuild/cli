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

class SettingsConfigStore {
  readonly #config: Conf<CliSettingsConfig>;

  private constructor(readonly config: Conf<CliSettingsConfig>) {
    this.#config = config;
  }

  static async init(): Promise<SettingsConfigStore> {
    const store = new SettingsConfigStore(getSettingsConfig());

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
        yellow('Your current configuration cannot be encrypted. Maybe it is already encrypted?')
      );
      console.log(err);
    }
  }
}

class SettingsStore {
  #settingsConfigStore: SettingsConfigStore | undefined;

  getSettingsStore = async (): Promise<SettingsConfigStore> => {
    if (isNullish(this.#settingsConfigStore)) {
      this.#settingsConfigStore = await SettingsConfigStore.init();
    }

    return this.#settingsConfigStore;
  };
}

// We initialize the settings only when necessary.
// That way, for example, a command such as "juno dev start" or "juno --version" can be run
// on first use without asking whether the configuration should be encoded or not.
const settingsStore = new SettingsStore();
export const {getSettingsStore} = settingsStore;
