import {listCustomDomains} from '@junobuild/admin';
import {red} from 'kleur';
import {junoConfigExist, readSatelliteConfig} from '../configs/juno.config';
import {configEnv} from '../utils/config.utils';
import {consoleUrl, defaultSatelliteDomain} from '../utils/domain.utils';
import {terminalLink} from '../utils/links.utils';
import {isProcessToken} from '../utils/process.utils';
import {satelliteParameters} from '../utils/satellite.utils';

export const links = async (args?: string[]) => {
  // If a developer is using a JUNO_TOKEN to execute command(s), the links will not be printed.
  // This is particularly useful for CI environment where such output is not needed and also because only ADMIN controllers can list custom domains.
  if (isProcessToken()) {
    return;
  }

  if (!(await junoConfigExist())) {
    return;
  }

  const {satelliteId} = await readSatelliteConfig(configEnv(args));

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
