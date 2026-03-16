import {isNullish, nonNullish} from '@dfinity/utils';
import {compare} from 'semver';
import {version as cliCurrentVersion} from '../../../package.json';
import {
  getCachedVersions,
  saveCachedVersions,
  updateLastCheckToNow
} from '../../configs/cli.versions.config';
import {githubCliLastRelease} from '../../rest/github.rest';
import {pmInstallHint} from '../../utils/pm.utils';
import {buildVersionFromGitHub, checkVersion} from './version.services';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const checkVersions = async () => {
  const cachedVersions = getCachedVersions();

  const lastCheck = cachedVersions.get('lastCheck');

  if (isNullish(lastCheck)) {
    saveCachedVersions({
      cli: {
        local: cliCurrentVersion
      }
    });
    return;
  }

  const cachedCliLocalVersion = cachedVersions.get('cli')?.local;

  // The version was never cached or the developer upgraded since the last check.
  // We assume they are on the latest version. If not, the next weekly check will catch it.
  if (isNullish(cachedCliLocalVersion) || compare(cliCurrentVersion, cachedCliLocalVersion) > 0) {
    saveCachedVersions({
      cli: {
        local: cliCurrentVersion
      }
    });
    return;
  }

  const checkIsDue = new Date(lastCheck.getTime() + ONE_WEEK_MS).getTime() <= new Date().getTime();

  const cachedCliRemoteVersion = cachedVersions.get('cli')?.remote;

  // The weekly check is not due and the current version of the CLI is up to date
  if (
    !checkIsDue &&
    nonNullish(cachedCliRemoteVersion) &&
    compare(cliCurrentVersion, cachedCliRemoteVersion) >= 0
  ) {
    return;
  }

  const result = await buildVersionFromGitHub({
    releaseFn: githubCliLastRelease
  });

  if (result.result === 'error') {
    updateLastCheckToNow();
    return;
  }

  const {latestVersion: remoteCliVersion} = result;

  saveCachedVersions({
    cli: {
      local: cliCurrentVersion,
      remote: remoteCliVersion
    }
  });

  checkVersion({
    currentVersion: cliCurrentVersion,
    latestVersion: remoteCliVersion,
    displayHint: 'CLI',
    commandLineHint: pmInstallHint()
  });
};
