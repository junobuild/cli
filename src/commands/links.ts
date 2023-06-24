import {listCustomDomains} from '@junobuild/admin';
import terminalLink from 'terminal-link';
import {consoleUrl, defaultSatelliteDomain} from '../utils/domain.utils';
import {junoConfigExist, readSatelliteConfig} from '../utils/satellite.config.utils';
import {satelliteParameters} from '../utils/satellite.utils';

export const links = async () => {
  if (!(await junoConfigExist())) {
    return;
  }

  const {satelliteId} = await readSatelliteConfig();

  const defaultUrl = defaultSatelliteDomain(satelliteId);
  const adminUrl = consoleUrl(satelliteId);

  const fallback = (_text: string, url: string) => `${url}`;

  console.log(`\n🛠️  ${terminalLink(adminUrl, adminUrl, {fallback})}`);

  const satellite = satelliteParameters(satelliteId);
  const domains = await listCustomDomains({satellite});

  if (domains.length === 0) {
    console.log(`🛰️  ${terminalLink(defaultUrl, defaultUrl, {fallback})}`);
    return;
  }

  domains.forEach(({domain}) =>
    console.log(`🌍 ${terminalLink(`https://${domain}`, `https://${domain}`, {fallback})}`)
  );
};
