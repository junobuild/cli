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
  projectName: string | 'juno';
  projectSettingsName: string | 'juno-cli-settings';
}