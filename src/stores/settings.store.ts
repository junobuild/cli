import {isNullish, nonNullish} from '@dfinity/utils';
import type Conf from 'conf';
import {yellow} from 'kleur';
import {getSettingsConfig, saveEncryption} from '../configs/cli.settings.config';
import {askForPassword} from '../services/cli.settings.services';
import type {CliSettings} from '../types/cli.settings';
import {configFileExists, loadConfig} from '../utils/cli.config.utils';
import {isHeadless} from '../utils/process.utils';
import {confirm} from '../utils/prompt.utils';

class SettingsConfigStore {
  readonly #config: Conf<CliSettings>;

  private constructor(readonly config: Conf<CliSettings>) {
    this.#config = config;
  }

  static async init(): Promise<SettingsConfigStore> {
    const store = new SettingsConfigStore(getSettingsConfig());

    if (isHeadless()) {
      return store;
    }

    // A developer might have launched the CLI, answered the encryption question, but never actually saved any config.
    // This can happen, for example, if the developer chooses to encrypt the config but presses Control+C
    // when prompted for the password the first time. To avoid requesting a password that was never set,
    // we prompt the developer again about whether to encrypt the config or not.
    // Since the file does not exist at all, it is safe to create a new one.
    const configExists = configFileExists();

    if (configExists && nonNullish(store.config.get('encryption'))) {
      return store;
    }

    const encryption = await confirm(
      'Do you want to encrypt the CLI config file stored on your machine for added security?'
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

  // eslint-disable-next-line @typescript-eslint/no-unused-private-class-members
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
