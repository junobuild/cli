import {listCustomDomains, type CustomDomain} from '@junobuild/admin';
import {assertAnswerCtrlC, hasArgs, nextArg} from '@junobuild/cli-tools';
import prompts from 'prompts';
import {junoConfigExist, readJunoConfig} from '../configs/juno.config';
import {configEnv} from '../utils/config.utils';
import {consoleUrl, defaultSatelliteDomain} from '../utils/domain.utils';
import {consoleNoConfigFound} from '../utils/msg.utils';
import {openUrl} from '../utils/open.utils';
import {satelliteParameters} from '../utils/satellite.utils';

export const open = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    consoleNoConfigFound();
    return;
  }

  const browser = nextArg({args, option: '-b'}) ?? nextArg({args, option: '--browser'});

  const env = configEnv(args);
  const {satellite: satelliteConfig} = await readJunoConfig(env);

  const satellite = await satelliteParameters({satellite: satelliteConfig, env});
  const {satelliteId} = satellite;

  if (hasArgs({args, options: ['-c', '--console']})) {
    await openUrl({url: consoleUrl(satelliteId), browser});
    return;
  }

  const domains = await listCustomDomains({satellite});

  if (domains.length === 0) {
    await openUrl({url: defaultSatelliteDomain(satelliteId), browser});
    return;
  }

  const url = await promptSatellites({domains, satelliteId});
  await openUrl({url, browser});
};

const promptSatellites = async ({
  satelliteId,
  domains
}: {
  satelliteId: string;
  domains: CustomDomain[];
}): Promise<string> => {
  const {url}: {url: string} = await prompts({
    type: 'select',
    name: 'url',
    message: 'Which URL of your satellite should be opened?',
    choices: [
      ...domains.map(({domain}) => ({title: `https://${domain}`, value: `https://${domain}`})),
      {title: defaultSatelliteDomain(satelliteId), value: defaultSatelliteDomain(satelliteId)}
    ]
  });

  assertAnswerCtrlC(url);

  return url;
};
