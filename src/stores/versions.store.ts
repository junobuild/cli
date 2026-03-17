import Conf from 'conf';
import {type CachedVersion, type CachedVersions} from '../types/stores/versions';

const getStore = (): Conf<CachedVersions> =>
  new Conf<CachedVersions>({projectName: 'juno-cli-versions'});

export const getCachedVersions = (): Conf<CachedVersions> => getStore();

export const isWeeklyCheckEnabled = (): boolean =>
  getCachedVersions().get('weeklyCheckEnabled') !== false;

export const isWeeklyCheckDisabled = (): boolean => !isWeeklyCheckEnabled();

export const toggleWeeklyCheck = (enabled: boolean) => {
  const config = getStore();
  config.set('weeklyCheckEnabled', enabled);
};

export const updateLastCheckToNow = ({
  key
}: {
  key: keyof Omit<CachedVersions, 'weeklyCheckEnabled'>;
}) => {
  const config = getStore();

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
  const config = getStore();
  config.set(key, {
    lastCheck: new Date().toISOString(),
    ...versions
  });
};
