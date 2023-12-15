import {listCustomDomains} from '@junobuild/admin';
import {red} from 'kleur';
import {dappConfigExist, readSatelliteConfig} from '../configs/dapp.config';
import {consoleUrl, defaultSatelliteDomain} from '../utils/domain.utils';
import {terminalLink} from '../utils/links.utils';
import {isProcessToken} from '../utils/process.utils';
import {satelliteParameters} from '../utils/satellite.utils';

export const links = async () => {
  // If a developer is using a JUNO_TOKEN to execute command(s), the links will not be printed.
  // This is particularly useful for CI environment where such output is not needed and also because only ADMIN controllers can list custom domains.
  if (isProcessToken()) {
    return;
  }

  if (!(await dappConfigExist())) {
    return;
  }

  const {satelliteId} = await readSatelliteConfig();

  const defaultUrl = defaultSatelliteDomain(satelliteId);
  const adminUrl = consoleUrl(satelliteId);

  try {
    const satellite = satelliteParameters(satelliteId);
    const domains = await listCustomDomains({satellite});

    console.log(`\n🛠️  ${terminalLink(adminUrl)}`);

    if (domains.length === 0) {
      console.log(`🛰️  ${terminalLink(defaultUrl)}`);
      return;
    }

    domains.forEach(({domain}) => {
      console.log(`🌍 ${terminalLink(`https://${domain}`)}`);
    });
  } catch (err: unknown) {
    console.log(`${red('Cannot list the custom domains.')}`);
  }
};
