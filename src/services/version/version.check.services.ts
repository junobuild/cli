import {isNullish, nonNullish} from '@dfinity/utils';
import {compare} from 'semver';
import {version as cliCurrentVersion} from '../../../package.json';
import {
  getCachedVersions,
  saveCliCachedVersions,
  updateCliLastCheckToNow
} from '../../configs/cli.versions.config';
import {githubCliLastRelease} from '../../rest/github.rest';
import {pmInstallHint} from '../../utils/pm.utils';
import {buildVersionFromGitHub, checkVersion} from './version.services';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const checkVersions = async () => {
  const cachedVersions = getCachedVersions();

  const cachedCli = cachedVersions.get('cli');

  const lastCheck = cachedCli?.lastCheck;

  if (isNullish(lastCheck)) {
    saveCliCachedVersions({
      local: cliCurrentVersion
    });
    return;
  }

  const cachedCliLocalVersion = cachedCli?.local;

  // The version was never cached or the developer upgraded since the last check.
  // We assume they are on the latest version. If not, the next weekly check will catch it.
  if (isNullish(cachedCliLocalVersion) || compare(cliCurrentVersion, cachedCliLocalVersion) > 0) {
    saveCliCachedVersions({
      local: cliCurrentVersion
    });
    return;
  }

  const checkIsDue =
    new Date(new Date(lastCheck).getTime() + ONE_WEEK_MS).getTime() <= new Date().getTime();

  const cachedCliRemoteVersion = cachedCli?.remote;

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
    updateCliLastCheckToNow();
    return;
  }

  const {latestVersion: remoteCliVersion} = result;

  saveCliCachedVersions({
    local: cliCurrentVersion,
    remote: remoteCliVersion
  });

  console.log(
    '\n────────────────────────────────────────────────────────────────────────────────────────────────────'
  );

  checkVersion({
    currentVersion: cliCurrentVersion,
    latestVersion: remoteCliVersion,
    displayHint: 'CLI',
    commandLineHint: pmInstallHint(),
    logUpToDate: false
  });

  console.log(
    '────────────────────────────────────────────────────────────────────────────────────────────────────'
  );
};
