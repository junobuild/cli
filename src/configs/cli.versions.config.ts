import Conf from 'conf';
import {type CachedVersion, type CachedVersions} from '../types/cli/cli.versions';

const getVersionConfig = (): Conf<CachedVersions> =>
  new Conf<CachedVersions>({projectName: 'juno-cli-versions'});

export const getCachedVersions = (): Conf<CachedVersions> => getVersionConfig();

export const updateLastCheckToNow = ({key}: {key: keyof CachedVersions}) => {
  const config = getVersionConfig();

  const currentVersions = config.get(key);

  config.set(key, {
    lastCheck: new Date().toISOString(),
    ...(currentVersions ?? {})
  });
};

export const saveCachedVersions = ({
  key,
  versions
}: {
  key: keyof CachedVersions;
  versions: Omit<CachedVersion, 'lastCheck'>;
}) => {
  const config = getVersionConfig();
  config.set(key, {
    lastCheck: new Date().toISOString(),
    ...versions
  });
};
