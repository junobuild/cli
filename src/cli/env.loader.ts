import {nextArg} from '@junobuild/cli-tools';
import {JunoCliEnv} from '../types/cli.env';

export const loadEnv = (): JunoCliEnv => {
  const [_, ...args] = process.argv.slice(2);

  const mode = nextArg({args, option: '-m'}) ?? nextArg({args, option: '--mode'});
  const containerUrl = nextArg({args, option: '--container-url'});
  const consoleUrl = nextArg({args, option: '--console-url'});

  const envContainerUrl =
    containerUrl ?? (mode === 'development' ? 'http://127.0.0.1:5987' : undefined);
  const envConsoleUrl =
    consoleUrl ?? (mode === 'development' ? 'http://localhost:5866' : 'https://console.juno.build');

  return {
    mode: mode ?? 'production',
    containerUrl: envContainerUrl,
    console: {
      urls: {
        root: envConsoleUrl,
        satellite: `${envConsoleUrl}/satellite/?s=`,
        auth: `${envConsoleUrl}/cli`
      }
    }
  };
};
