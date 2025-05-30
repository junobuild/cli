import {isNullish, nonNullish, notEmptyString} from '@dfinity/utils';
import {
  findJunoPackageDependency,
  getJunoPackage,
  getJunoPackageVersion,
  missionControlVersion as missionControlVersionLib,
  orbiterVersion as orbiterVersionLib,
  satelliteVersion as satelliteVersionLib
} from '@junobuild/admin';
import {hasArgs} from '@junobuild/cli-tools';
import {JUNO_PACKAGE_SATELLITE_ID} from '@junobuild/config';
import {cyan, green, red, yellow} from 'kleur';
import {clean, compare} from 'semver';
import {version as cliCurrentVersion} from '../../package.json';
import {actorParameters} from '../api/actor.api';
import {getCliMissionControl, getCliOrbiters} from '../configs/cli.config';
import {
  MISSION_CONTROL_WASM_NAME,
  ORBITER_WASM_NAME,
  SATELLITE_WASM_NAME
} from '../constants/constants';
import {githubCliLastRelease} from '../rest/github.rest';
import type {AssetKey} from '../types/asset-key';
import {toAssetKeys} from '../utils/asset-key.utils';
import {
  assertConfigAndLoadSatelliteContext,
  orbiterKey,
  satelliteKey
} from '../utils/satellite.utils';
import {lastRelease} from '../utils/upgrade.utils';

export const version = async (args?: string[]) => {
  await cliVersion();

  if (hasArgs({args, options: ['-c', '--cli']})) {
    return;
  }

  await missionControlVersion();
  await satelliteVersion(args);
  await orbitersVersion();
};

const cliVersion = async () => {
  const githubRelease = await githubCliLastRelease();

  if (githubRelease === undefined) {
    console.log(red('Cannot fetch last release version of Juno on GitHub 😢.'));
    return;
  }

  const {tag_name} = githubRelease;

  const latestVersion = clean(tag_name);

  if (isNullish(latestVersion)) {
    console.log(red(`Cannot extract version from release. Reach out Juno❗️`));
    return;
  }

  checkVersion({
    currentVersion: cliCurrentVersion,
    latestVersion,
    displayHint: 'CLI',
    commandLineHint: `npm i -g @junobuild/cli`
  });
};

const missionControlVersion = async () => {
  const missionControl = await getCliMissionControl();

  if (isNullish(missionControl)) {
    console.log(
      `${yellow(
        'No mission control found.'
      )} Ignore this error if your controller does not control your mission control.`
    );
    return;
  }

  const actorParams = await actorParameters();

  const getVersion = async (): Promise<string> => {
    const version = await getJunoPackageVersion({
      moduleId: missionControl,
      ...actorParams
    });

    if (nonNullish(version) && notEmptyString(version)) {
      return version;
    }

    // Legacy
    const missionControlParameters = {
      missionControlId: missionControl,
      ...actorParams
    };

    return await missionControlVersionLib({
      missionControl: missionControlParameters
    });
  };

  const currentVersion = await getVersion();

  const displayHint = `mission control`;

  await checkSegmentVersion({
    currentVersion,
    assetKey: MISSION_CONTROL_WASM_NAME,
    displayHint
  });
};

const satelliteVersion = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);
  const {satelliteId, ...actorParams} = satellite;

  const getVersion = async (): Promise<string | undefined> => {
    const pkg = await getJunoPackage({
      moduleId: satelliteId,
      ...actorParams
    });

    if (nonNullish(pkg)) {
      const {dependencies, version} = pkg;

      // It's a stock Satellite
      if (isNullish(dependencies)) {
        return version;
      }

      // It's extended, we search for the dependency.
      const satelliteDependency = findJunoPackageDependency({
        dependencies,
        dependencyId: JUNO_PACKAGE_SATELLITE_ID
      });

      if (isNullish(satelliteDependency)) {
        return undefined;
      }

      const [_, versionSatellite] = satelliteDependency;
      return versionSatellite;
    }

    // Legacy
    return await satelliteVersionLib({
      satellite
    });
  };

  const displayHint = `satellite "${await satelliteKey(satelliteId)}"`;

  const currentVersion = await getVersion();

  if (isNullish(currentVersion)) {
    console.log(red(`Cannot retrieve the current version of ${displayHint} 😢.`));
    return;
  }

  await checkSegmentVersion({
    currentVersion,
    assetKey: SATELLITE_WASM_NAME,
    displayHint
  });
};

const orbitersVersion = async () => {
  const orbiters = await getCliOrbiters();

  if (isNullish(orbiters) || orbiters.length === 0) {
    return;
  }

  const checkOrbiterVersion = async (orbiterId: string) => {
    const actorParams = await actorParameters();

    const orbiterParameters = {
      orbiterId,
      ...actorParams
    };

    const getVersion = async (): Promise<string> => {
      const version = await getJunoPackageVersion({
        moduleId: orbiterId,
        ...actorParams
      });

      if (nonNullish(version) && notEmptyString(version)) {
        return version;
      }

      // Legacy
      return await orbiterVersionLib({
        orbiter: orbiterParameters
      });
    };

    const currentVersion = await getVersion();

    const displayHint = `orbiter "${await orbiterKey(orbiterId)}"`;

    await checkSegmentVersion({
      currentVersion,
      assetKey: ORBITER_WASM_NAME,
      displayHint
    });
  };

  await Promise.allSettled(
    orbiters.map(async ({p: orbiterId}) => {
      await checkOrbiterVersion(orbiterId);
    })
  );
};

const checkSegmentVersion = async ({
  currentVersion,
  assetKey,
  displayHint
}: {
  currentVersion: string;
  assetKey: AssetKey;
  displayHint: string;
}): Promise<void> => {
  const latestVersion = await lastRelease(toAssetKeys(assetKey));

  if (latestVersion === undefined) {
    console.log(red(`Cannot fetch last release version of ${displayHint} on Juno's CDN 😢.`));
    return;
  }

  checkVersion({
    currentVersion,
    latestVersion,
    displayHint,
    commandLineHint: `juno upgrade${assetKey === 'mission_control' ? '-t m' : ''}`
  });
};

const checkVersion = ({
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
