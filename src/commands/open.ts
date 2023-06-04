import {CustomDomain, listCustomDomains} from '@junobuild/admin';
import prompts from 'prompts';
import {CONSOLE_SATELLITE_URL} from '../constants/constants';
import {hasArgs, nextArg} from '../utils/args.utils';
import {consoleNoConfigFound} from '../utils/msg.utils';
import {openUrl} from '../utils/open.utils';
import {junoConfigExist, readSatelliteConfig} from '../utils/satellite.config.utils';
import {satelliteParameters} from '../utils/satellite.utils';

export const open = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    consoleNoConfigFound();
    return;
  }

  const browser = nextArg({args, option: '-b'}) ?? nextArg({args, option: '--browser'});

  const {satelliteId} = await readSatelliteConfig();
  if (hasArgs({args, options: ['-c', '--console']})) {
    await openUrl({url: `${CONSOLE_SATELLITE_URL}${satelliteId}`, browser});
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

const defaultSatelliteDomain = (satelliteId: string): string => `https://${satelliteId}.icp0.io`;

const promptSatellites = async ({
  satelliteId,
  domains
}: {
  satelliteId: string;
  domains: CustomDomain[];
}): Promise<string> => {
  const {url} = await prompts({
    type: 'select',
    name: 'url',
    message: 'Which URL of your satellite should be opened?',
    choices: [
      ...domains.map(({domain}) => ({title: `https://${domain}`, value: `https://${domain}`})),
      {title: defaultSatelliteDomain(satelliteId), value: defaultSatelliteDomain(satelliteId)}
    ]
  });

  // In case of control+c
  if (url === undefined || url === '') {
    process.exit(1);
  }

  return url;
};
