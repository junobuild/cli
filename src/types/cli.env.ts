import type {JunoConfigEnv} from '@junobuild/config';

export type JunoCliEnv = JunoConfigEnv & {
  containerUrl: string | undefined;
  console: JunoConsole;
  config: JunoCliConfig;
  ci: boolean;
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
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  projectName: string | 'juno';
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  projectSettingsName: string | 'juno-cli-settings';
}
