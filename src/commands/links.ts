import {listCustomDomains} from '@junobuild/admin';
import {red} from 'kleur';
import terminalLink from 'terminal-link';
import {junoConfigExist, readSatelliteConfig} from '../configs/satellite.config';
import {consoleUrl, defaultSatelliteDomain} from '../utils/domain.utils';
import {isProcessToken} from '../utils/process.utils';
import {satelliteParameters} from '../utils/satellite.utils';

export const links = async () => {
  // If a developer is using a JUNO_TOKEN to execute command(s), the links will not be printed.
  // This is particularly useful for CI environment where such output is not needed and also because only ADMIN controllers can list custom domains.
  if (isProcessToken()) {
    return;
  }

  if (!(await junoConfigExist())) {
    return;
  }

  const {satelliteId} = await readSatelliteConfig();

  const defaultUrl = defaultSatelliteDomain(satelliteId);
  const adminUrl = consoleUrl(satelliteId);

  try {
    const satellite = satelliteParameters(satelliteId);
    const domains = await listCustomDomains({satellite});

    const fallback = (_text: string, url: string) => `${url}`;

    console.log(`\n🛠️  ${terminalLink(adminUrl, adminUrl, {fallback})}`);

    if (domains.length === 0) {
      console.log(`🛰️  ${terminalLink(defaultUrl, defaultUrl, {fallback})}`);
      return;
    }

    domains.forEach(({domain}) =>
      console.log(`🌍 ${terminalLink(`https://${domain}`, `https://${domain}`, {fallback})}`)
    );
  } catch (err: unknown) {
    console.log(`${red('Cannot list the custom domains.')}`);
  }
};
