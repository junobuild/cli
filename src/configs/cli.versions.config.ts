import Conf from 'conf';
import {CachedVersions} from '../types/cli/cli.versions';

const getVersionConfig = (): Conf<CachedVersions> =>
  new Conf<CachedVersions>({projectName: 'juno-cli-versions'});

export const getCachedVersions = (): Conf<CachedVersions> => getVersionConfig();

export const updateLastCheckToNow = () => {
  const config = getVersionConfig();
  config.set('lastCheck', new Date().toISOString());
};

export const saveCachedVersions = (versions: Omit<CachedVersions, 'lastCheck'>) => {
  const config = getVersionConfig();
  config.set({
    lastCheck: new Date().toISOString(),
    ...versions
  });
};
