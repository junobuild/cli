import type {JunoConfigEnv} from '@junobuild/config';

export type JunoCliEnv = JunoConfigEnv & {
  containerUrl: string | undefined;
  console: JunoConsole;
};

interface JunoConsole {
  urls: JunoConsoleUrls;
}

interface JunoConsoleUrls {
  root: string;
  satellite: string;
  auth: string;
}
