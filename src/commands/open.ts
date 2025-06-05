import {listCustomDomains, type CustomDomain} from '@junobuild/admin';
import {assertAnswerCtrlC, hasArgs, nextArg} from '@junobuild/cli-tools';
import prompts from 'prompts';
import {consoleUrl, defaultSatelliteDomain} from '../utils/domain.utils';
import {openUrl} from '../utils/open.utils';
import {assertConfigAndLoadSatelliteContext} from '../utils/satellite.utils';

export const open = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext();
  const {satelliteId} = satellite;

  const browser = nextArg({args, option: '-b'}) ?? nextArg({args, option: '--browser'});

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
