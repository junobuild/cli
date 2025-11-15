import {isNullish, nonNullish, notEmptyString} from '@dfinity/utils';
import {Ed25519KeyIdentity} from '@icp-sdk/core/identity';
import type {ActorParameters} from '@junobuild/ic-client/actor';
import {green, red, yellow} from 'kleur';
import {getToken} from '../configs/cli.config';
import {readEmulatorConfig} from '../configs/emulator.config';
import {ENV} from '../env';
import {noConfigFile} from '../utils/config.utils';
import {getProcessToken, isHeadless} from '../utils/process.utils';
import {initAgent} from './agent.api';

export const actorParameters = async (): Promise<
  Omit<ActorParameters, 'agent'> & Required<Pick<ActorParameters, 'agent'>>
> => {
  const configNotFound = !isHeadless() && noConfigFile();

  if (configNotFound) {
    await missingConfigInfo({errorType: 'not-configured'});

    process.exit(1);
  }

  const token = getProcessToken() ?? (await getToken());

  if (isNullish(token)) {
    await missingConfigInfo({errorType: 'not-logged-in'});

    process.exit(1);
  }

  const identity = Ed25519KeyIdentity.fromParsedJson(token);

  const params: Omit<ActorParameters, 'agent'> = {
    identity,
    ...(nonNullish(ENV.containerUrl) && {container: ENV.containerUrl})
  };

  const agent = await initAgent(params);

  return {
    ...params,
    agent
  };
};

const missingConfigInfo = async ({errorType}: {errorType: 'not-configured' | 'not-logged-in'}) => {
  console.log(
    `${red(`Looks like your CLI is not ${errorType === 'not-logged-in' ? 'logged in' : 'configured'}.`)} Try to run:`
  );

  const parsedResult = await readEmulatorConfig();
  const satelliteEmulator =
    parsedResult.success && parsedResult.config.derivedConfig.emulatorType === 'satellite';

  console.log(
    `\n👉 ${green('juno')} ${green('login')}${ENV.mode !== 'production' ? ` ${yellow(`--mode ${ENV.mode}`)}` : ''}${notEmptyString(ENV.profile) ? ` ${yellow(`--profile ${ENV.profile}`)}` : ''}${satelliteEmulator ? ` ${yellow(`--emulator`)}` : ''}`
  );
};
