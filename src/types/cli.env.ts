import type {JunoConfigEnv} from '@junobuild/config';

export type JunoCliEnv = JunoConfigEnv & {
  containerUrl: string | undefined;
  console: JunoConsole;
  config: JunoCliConfig;
};

export interface JunoConsole {
  urls: JunoConsoleUrls;
}

export interface JunoConsoleUrls {
  root: string;
  satellite: string;
  auth: string;
}

export interface JunoCliConfig {
  // @typescript-eslint/no-redundant-type-constituents
  projectName: string | 'juno';
  // @typescript-eslint/no-redundant-type-constituents
  projectSettingsName: string | 'juno-cli-settings';
}
