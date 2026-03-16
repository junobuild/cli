import Conf from 'conf';
import {CachedVersion, CachedVersions} from '../types/cli/cli.versions';

const getVersionConfig = (): Conf<CachedVersions> =>
  new Conf<CachedVersions>({projectName: 'juno-cli-versions'});

export const getCachedVersions = (): Conf<CachedVersions> => getVersionConfig();

export const updateCliLastCheckToNow = () => {
  const config = getVersionConfig();

  const currentCli = config.get('cli');

  config.set('cli', {
    lastCheck: new Date().toISOString(),
    ...(currentCli ?? {})
  });
};

export const saveCliCachedVersions = (versions: Omit<CachedVersion, 'lastCheck'>) => {
  const config = getVersionConfig();
  config.set('cli', {
    lastCheck: new Date().toISOString(),
    ...versions
  });
};
