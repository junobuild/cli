import {notEmptyString} from '@dfinity/utils';
import {nextArg} from '@junobuild/cli-tools';
import {type JunoCliConfig, type JunoCliEnv, type JunoConsole} from '../types/cli.env';

export const loadEnv = (): JunoCliEnv => {
  const [_, ...args] = process.argv.slice(2);

  const mode = nextArg({args, option: '-m'}) ?? nextArg({args, option: '--mode'});
  const profile = nextArg({args, option: '-p'}) ?? nextArg({args, option: '--profile'});
  const containerUrl = nextArg({args, option: '--container-url'});

  const envContainerUrl =
    containerUrl ?? (mode === 'development' ? 'http://127.0.0.1:5987' : undefined);

  const ci = process.env.CI === 'true';

  return {
    profile,
    mode: mode ?? 'production',
    containerUrl: envContainerUrl,
    console: loadEnvConsole({args, mode}),
    config: loadEnvConfig({mode, profile}),
    ci
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

const loadEnvConfig = ({
  mode,
  profile
}: {
  mode: string | undefined;
  profile: string | undefined;
}): JunoCliConfig => {
  // Historically we used "juno" - without environment reference - for production.
  // That is why we keep this default approach for backwards compatibility.
  const modeSuffix =
    notEmptyString(mode) && (mode !== 'production' || notEmptyString(profile)) ? `-${mode}` : '';

  const profileSuffix = notEmptyString(profile) ? `-${profile}` : '';

  const projectName = `juno${profileSuffix}${modeSuffix}`;

  return {
    projectName,
    projectSettingsName: `${projectName}-cli-settings`,
    projectStateName: `${projectName}-cli-state`
  };
};
