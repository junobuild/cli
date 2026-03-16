import {isNullish, nonNullish} from '@dfinity/utils';
import ora from 'ora';
import {compare} from 'semver';
import {version as cliCurrentVersion} from '../../../package.json';
import {
  getCachedVersions,
  saveCachedVersions,
  updateLastCheckToNow
} from '../../configs/cli.versions.config';
import {
  githubCliLastRelease,
  githubJunoDockerLastRelease,
  GithubLastReleaseResult
} from '../../rest/github.rest';
import {CachedVersions} from '../../types/cli/cli.versions';
import {pmInstallHint} from '../../utils/pm.utils';
import {findEmulatorVersion} from '../emulator/version.services';
import {
  buildVersionFromGitHub,
  BuildVersionFromGitHubResult,
  checkVersion
} from './version.services';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const checkCliVersion = async () => {
  const checkVersionFn = ({latestVersion}: {latestVersion: string}) => {
    checkVersion({
      currentVersion: cliCurrentVersion,
      latestVersion,
      displayHint: 'CLI',
      commandLineHint: pmInstallHint(),
      logUpToDate: false,
      logSpacer: true
    });
  };

  await check({
    key: 'cli',
    currentVersion: cliCurrentVersion,
    releaseFn: githubCliLastRelease,
    checkVersionFn
  });
};

export const checkEmulatorVersion = async () => {
  const emulatorResult = await findEmulatorVersion();

  if (emulatorResult.status !== 'success') {
    return;
  }

  const {version: emulatorCurrentVersion} = emulatorResult;

  // We fetched the emulator but the version is null which could happen has providing the metadata
  // was patched in Juno Docker v0.6.3
  if (isNullish(emulatorCurrentVersion)) {
    return;
  }

  const checkVersionFn = ({latestVersion}: {latestVersion: string}) => {
    checkVersion({
      currentVersion: emulatorCurrentVersion,
      latestVersion,
      displayHint: 'Emulator',
      logUpToDate: false,
      logSpacer: true
    });
  };

  await check({
    key: 'emulator',
    currentVersion: emulatorCurrentVersion,
    releaseFn: githubJunoDockerLastRelease,
    checkVersionFn
  });
};

const check = async ({
  key,
  currentVersion,
  releaseFn,
  checkVersionFn
}: {
  key: keyof CachedVersions;
  currentVersion: string;
  releaseFn: () => Promise<GithubLastReleaseResult>;
  checkVersionFn: (params: {latestVersion: string}) => void;
}) => {
  const cachedVersions = getCachedVersions();

  const cachedInfo = cachedVersions.get(key);

  const lastCheck = cachedInfo?.lastCheck;

  if (isNullish(lastCheck)) {
    saveCachedVersions({
      key,
      versions: {
        local: currentVersion
      }
    });
    return;
  }

  const cachedLocalVersion = cachedInfo?.local;

  // The version was never cached or the developer upgraded since the last check.
  // We assume they are on the latest version. If not, the next weekly check will catch it.
  if (isNullish(cachedLocalVersion) || compare(currentVersion, cachedLocalVersion) > 0) {
    saveCachedVersions({
      key,
      versions: {
        local: currentVersion
      }
    });
    return;
  }

  const checkIsDue =
    new Date(new Date(lastCheck).getTime() + ONE_WEEK_MS).getTime() <= new Date().getTime();

  const cachedRemoteVersion = cachedInfo?.remote;

  // The weekly check is not due and the current version of the CLI is up to date
  if (
    !checkIsDue &&
    nonNullish(cachedRemoteVersion) &&
    compare(currentVersion, cachedRemoteVersion) >= 0
  ) {
    return;
  }

  const loadVersionWithGitHub = async (): Promise<BuildVersionFromGitHubResult> => {
    const spinner = ora(`Two secs, fetching ${key} latest version...`).start();

    try {
      return await buildVersionFromGitHub({
        releaseFn
      });
    } finally {
      spinner.stop();
    }
  };

  const result = await loadVersionWithGitHub();

  if (result.result === 'error') {
    updateLastCheckToNow({key});
    return;
  }

  const {latestVersion} = result;

  saveCachedVersions({
    key,
    versions: {
      local: currentVersion,
      remote: latestVersion
    }
  });

  checkVersionFn({latestVersion});
};
