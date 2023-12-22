import {listCustomDomains, type CustomDomain} from '@junobuild/admin';
import prompts from 'prompts';
import {junoConfigExist, readSatelliteConfig} from '../configs/juno.config';
import {hasArgs, nextArg} from '../utils/args.utils';
import {consoleUrl, defaultSatelliteDomain} from '../utils/domain.utils';
import {consoleNoConfigFound} from '../utils/msg.utils';
import {openUrl} from '../utils/open.utils';
import {satelliteParameters} from '../utils/satellite.utils';
import {assertAnswerCtrlC} from './init';

export const open = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    consoleNoConfigFound();
    return;
  }

  const browser = nextArg({args, option: '-b'}) ?? nextArg({args, option: '--browser'});

  const {satelliteId} = await readSatelliteConfig();
  if (hasArgs({args, options: ['-c', '--console']})) {
    await openUrl({url: consoleUrl(satelliteId), browser});
    return;
  }

  const satellite = satelliteParameters(satelliteId);
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
