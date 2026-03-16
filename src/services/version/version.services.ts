import {isNullish, nonNullish} from '@dfinity/utils';
import {
  findJunoPackageDependency,
  getJunoPackage,
  satelliteVersion as satelliteVersionLib
} from '@junobuild/admin';
import {JUNO_PACKAGE_SATELLITE_ID} from '@junobuild/config';
import {cyan, green, red, yellow} from 'kleur';
import ora from 'ora';
import {clean, compare} from 'semver';
import {GithubLastReleaseResult} from '../../rest/github.rest';
import type {SatelliteParametersWithId} from '../../types/satellite';
import {assertConfigAndLoadSatelliteContext} from '../../utils/juno.config.utils';

export const getSatelliteVersion = async (): Promise<
  {result: 'success'; version: string} | {result: 'error'}
> => {
  // Read parameters first to not display the loading spinner while accessing the config
  const {satellite} = await assertConfigAndLoadSatelliteContext();

  const spinner = ora('Loading version...').start();

  try {
    const result = await loadSatelliteVersion({satellite});

    spinner.stop();

    if (result.result === 'error') {
      console.log(red(result.reason));
    }

    return result;
  } catch (err: unknown) {
    spinner.stop();
    throw err;
  }
};

const loadSatelliteVersion = async ({
  satellite
}: {
  satellite: SatelliteParametersWithId;
}): Promise<{result: 'success'; version: string} | {result: 'error'; reason: string}> => {
  const {satelliteId, ...actorParams} = satellite;

  const pkg = await getJunoPackage({
    moduleId: satelliteId,
    ...actorParams
  });

  if (nonNullish(pkg)) {
    const {dependencies, version} = pkg;

    // It's a stock Satellite
    if (isNullish(dependencies)) {
      return {result: 'success', version};
    }

    // It's extended, we search for the dependency.
    const satelliteDependency = findJunoPackageDependency({
      dependencies,
      dependencyId: JUNO_PACKAGE_SATELLITE_ID
    });

    if (isNullish(satelliteDependency)) {
      return {result: 'error', reason: 'Cannot retrieve the current version of your Satellite 😢.'};
    }

    const [_, versionSatellite] = satelliteDependency;
    return {result: 'success', version: versionSatellite};
  }

  // Legacy
  const legacyVersion = await satelliteVersionLib({
    satellite
  });

  return {result: 'success', version: legacyVersion};
};

export interface CheckVersionResult {
  diff: 'up-to-date' | 'outdated' | 'error';
}

export const checkVersion = ({
  currentVersion,
  latestVersion,
  displayHint,
  commandLineHint,
  logUpToDate = true
}: {
  currentVersion: string;
  latestVersion: string;
  displayHint: string;
  commandLineHint?: string;
  logUpToDate?: boolean;
}): CheckVersionResult => {
  const diff = compare(currentVersion, latestVersion);

  if (diff === 0) {
    if (logUpToDate) {
      console.log(`Your ${displayHint} (${green(`v${currentVersion}`)}) is up-to-date.`);
    }

    return {diff: 'up-to-date'};
  }

  if (diff === 1) {
    console.log(yellow(`Your ${displayHint} version is more recent than the latest available 🤔.`));
    return {diff: 'error'};
  }

  console.log(
    `Your ${displayHint} (${yellow(`v${currentVersion}`)}) is behind the latest version (${green(
      `v${latestVersion}`
    )}).${nonNullish(commandLineHint) ? ` Run ${cyan(commandLineHint)} to update it.` : ''}`
  );

  return {diff: 'outdated'};
};

export const buildVersionFromGitHub = async ({
  releaseFn,
  logReleaseOnError
}: {
  releaseFn: () => Promise<GithubLastReleaseResult>;
  logReleaseOnError?: () => 'CLI' | 'Juno Docker';
}): Promise<{result: 'success'; latestVersion: string} | {result: 'error'}> => {
  const githubRelease = await releaseFn();

  if (githubRelease.status === 'error') {
    if (nonNullish(logReleaseOnError)) {
      console.log(red(`Cannot fetch the last version of ${logReleaseOnError()} on GitHub 😢.`));
    }

    return {result: 'error'};
  }

  const {
    release: {tag_name}
  } = githubRelease;

  const latestVersion = clean(tag_name);

  if (isNullish(latestVersion)) {
    if (nonNullish(logReleaseOnError)) {
      console.log(
        red(`Cannot extract version from the ${logReleaseOnError()} release. Reach out Juno❗️`)
      );
    }

    return {result: 'error'};
  }

  return {result: 'success', latestVersion};
};
