import {isNullish, nonNullish} from '@dfinity/utils';
import {
  findJunoPackageDependency,
  getJunoPackage,
  satelliteVersion as satelliteVersionLib
} from '@junobuild/admin';
import {JUNO_PACKAGE_SATELLITE_ID} from '@junobuild/config';
import {cyan, green, red, yellow} from 'kleur';
import ora from 'ora';
import {compare} from 'semver';
import type {SatelliteParametersWithId} from '../types/satellite';
import {assertConfigAndLoadSatelliteContext} from '../utils/juno.config.utils';

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

export const checkVersion = ({
  currentVersion,
  latestVersion,
  displayHint,
  commandLineHint
}: {
  currentVersion: string;
  latestVersion: string;
  displayHint: string;
  commandLineHint: string;
}) => {
  const diff = compare(currentVersion, latestVersion);

  if (diff === 0) {
    console.log(`Your ${displayHint} (${green(`v${currentVersion}`)}) is up-to-date.`);
    return;
  }

  if (diff === 1) {
    console.log(yellow(`Your ${displayHint} version is more recent than the latest available 🤔.`));
    return;
  }

  console.log(
    `Your ${displayHint} (${yellow(`v${currentVersion}`)}) is behind the latest version (${green(
      `v${latestVersion}`
    )}) available. Run ${cyan(commandLineHint)} to update it.`
  );
};
