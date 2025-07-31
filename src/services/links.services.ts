import {listCustomDomains} from '@junobuild/admin';
import {yellow} from 'kleur';
import {consoleUrl, defaultSatelliteDomain} from '../utils/domain.utils';
import {terminalLink} from '../utils/links.utils';
import {isHeadless} from '../utils/process.utils';
import {assertConfigAndLoadSatelliteContext} from '../utils/satellite.utils';

export const links = async () => {
  const {satellite} = await assertConfigAndLoadSatelliteContext();
  const {satelliteId} = satellite;

  const defaultUrl = defaultSatelliteDomain(satelliteId);
  const adminUrl = consoleUrl(satelliteId);

  try {
    // If a developer is using a JUNO_TOKEN to execute command(s), the custom domain will not be queried or printed.
    // This is particularly useful in CI environments where access keys might be limited,
    // and only ADMIN controllers can list custom domains.
    const domains = isHeadless() ? [] : await listCustomDomains({satellite});

    console.log(`\n🛠️  ${terminalLink(adminUrl)}`);

    if (domains.length === 0) {
      console.log(`🛰️  ${terminalLink(defaultUrl)}`);
      return;
    }

    domains.forEach(({domain}) => {
      console.log(`🌍 ${terminalLink(`https://${domain}`)}`);
    });
  } catch (_err: unknown) {
    console.log(yellow('Custom domains could not be listed'));
  }
};
