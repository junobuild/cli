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

class SettingsStore {
  readonly #config: Conf<CliSettingsConfig>;

  private constructor(readonly config: Conf<CliSettingsConfig>) {
    this.#config = config;
  }

  static async init(): Promise<SettingsStore> {
    const store = new SettingsStore(getSettingsConfig());

    console.log('---->', store.config.get('encryption'));

    if (nonNullish(store.config.get('encryption'))) {
      return store;
    }

    const encryption = await confirm(
      'Do you want to encrypt your configuration file for added security?'
    );

    saveEncryption(encryption);

    return store;
  }

  useEncryption(): boolean {
    return this.#config.get('encryption');
  }
}

export const settingsStore: SettingsStore = await SettingsStore.init();
