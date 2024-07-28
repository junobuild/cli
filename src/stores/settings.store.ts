import {nonNullish} from '@junobuild/utils';
import {
  type CliSettingsConfig,
  getSettingsConfig,
  saveEncryption
} from '../configs/cli.settings.config';
import {confirm} from '../utils/prompt.utils';
// TODO: fix TypeScript declaration import of conf
// @ts-expect-error
import type Conf from 'conf';
import {loadConfig} from '../utils/config.utils';

class SettingsStore {
  readonly #config: Conf<CliSettingsConfig>;

  private constructor(readonly config: Conf<CliSettingsConfig>) {
    this.#config = config;
  }

  static async init(): Promise<SettingsStore> {
    const store = new SettingsStore(getSettingsConfig());

    if (nonNullish(store.config.get('encryption'))) {
      return store;
    }

    const encryption = await confirm(
      'Do you want to encrypt your configuration file for added security?'
    );

    saveEncryption(encryption);

    if (encryption) {
      await store.migrateConfig();
    }

    return store;
  }

  useEncryption(): boolean {
    return this.#config.get('encryption');
  }

  private async migrateConfig() {
    try {
      const config = loadConfig(undefined);

      // TODO
    } catch (err: unknown) {
      // TODO
    }
  }
}

export const settingsStore: SettingsStore = await SettingsStore.init();
