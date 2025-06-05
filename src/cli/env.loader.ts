import {notEmptyString} from '@dfinity/utils';
import {nextArg} from '@junobuild/cli-tools';
import {JunoCliConfig, JunoCliEnv, JunoConsole} from '../types/cli.env';

export const loadEnv = (): JunoCliEnv => {
  const [_, ...args] = process.argv.slice(2);

  const mode = nextArg({args, option: '-m'}) ?? nextArg({args, option: '--mode'});
  const containerUrl = nextArg({args, option: '--container-url'});

  const envContainerUrl =
    containerUrl ?? (mode === 'development' ? 'http://127.0.0.1:5987' : undefined);

  return {
    mode: mode ?? 'production',
    containerUrl: envContainerUrl,
    console: loadEnvConsole({args, mode}),
    config: loadEnvConfig({mode})
  };
};

const loadEnvConsole = ({args, mode}: {args?: string[]; mode: string | undefined}): JunoConsole => {
  const consoleUrl = nextArg({args, option: '--console-url'});

  const envConsoleUrl =
    consoleUrl ?? (mode === 'development' ? 'http://localhost:5866' : 'https://console.juno.build');

  return {
    urls: {
      root: envConsoleUrl,
      satellite: `${envConsoleUrl}/satellite/?s=`,
      auth: `${envConsoleUrl}/cli`
    }
  };
};

const loadEnvConfig = ({mode}: {mode: string | undefined}): JunoCliConfig => {
  // Historically we used "juno" - without environment reference - for production.
  // That is why we keep this approach for backwards compatibility.
  const projectName = notEmptyString(mode) && mode !== 'production' ? `juno-${mode}` : 'juno';

  return {
    projectName,
    projectSettingsName: `${projectName}-cli-settings`
  };
};
