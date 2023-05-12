import {
  SatelliteParameters,
  missionControlVersion,
  satelliteVersion,
  upgradeMissionControl as upgradeMissionControlAdmin,
  upgradeSatellite as upgradeSatelliteAdmin,
  type MissionControlParameters
} from '@junobuild/admin';
import {red, yellow} from 'kleur';
import prompts from 'prompts';
import {coerce, compare, eq, gt, lt, major, minor, patch, type SemVer} from 'semver';
import {MISSION_CONTROL_WASM_NAME, SATELLITE_WASM_NAME} from '../constants/constants';
import {actorParameters} from '../utils/actor.utils';
import {hasArgs, nextArg} from '../utils/args.utils';
import {getMissionControl} from '../utils/auth.config.utils';
import {GitHubAsset, GitHubRelease, githubJunoReleases} from '../utils/github.utils';
import {junoConfigExist, readSatelliteConfig} from '../utils/satellite.config.utils';
import {satelliteKey, satelliteParameters} from '../utils/satellite.utils';
import {upgradeWasmGitHub, upgradeWasmLocal} from '../utils/wasm.utils';

export const upgrade = async (args?: string[]) => {
  if (hasArgs({args, options: ['-m', '--mission-control']})) {
    await upgradeMissionControl(args);
    return;
  }

  await upgradeSatellite(args);
};

const upgradeMissionControl = async (args?: string[]) => {
  const missionControl = getMissionControl();

  if (!missionControl) {
    console.log(
      `${red(
        'No mission control found.'
      )} Ignore this error if your controller does not control your mission control.`
    );
    return;
  }

  const missionControlParameters = {
    missionControlId: missionControl,
    ...actorParameters()
  };

  if (hasArgs({args, options: ['-s', '--src']})) {
    await upgradeMissionControlCustom({args, missionControlParameters});
    return;
  }

  await updateMissionControlRelease(missionControlParameters);
};

const upgradeSatellite = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    console.log(`${red('No configuration found.')}`);
    return;
  }

  const {satelliteId} = await readSatelliteConfig();

  const satellite = satelliteParameters(satelliteId);

  if (hasArgs({args, options: ['-s', '--src']})) {
    await upgradeSatelliteCustom({satellite, args});
    return;
  }

  await upgradeSatelliteRelease(satellite);
};

const promptReleases = async ({
  githubReleases,
  assetKey
}: {
  githubReleases: GitHubRelease[];
  assetKey: 'satellite' | 'mission_control';
}): Promise<GitHubAsset | undefined> => {
  const choices = githubReleases.reduce((acc, {tag_name, assets}: GitHubRelease) => {
    const asset = assets?.find(({name}) => name.includes(assetKey));

    const version = coerce(asset?.name ?? '');

    const title = `v${version} (published in Juno ${tag_name})`;

    return [...acc, ...(asset !== undefined ? [{title, value: asset}] : [])];
  }, [] as {title: string; value: GitHubAsset}[]);

  const {asset} = await prompts({
    type: 'select',
    name: 'asset',
    message: `To which version should your ${assetKey.replace('_', ' ')} be upgraded?`,
    choices,
    initial: 0
  });

  // In case of control+c
  if (asset === undefined) {
    process.exit(1);
  }

  return asset;
};

const checkVersion = ({
  currentVersion,
  selectedVersion,
  displayHint
}: {
  currentVersion: string;
  selectedVersion: string;
  displayHint: string;
}): {canUpgrade: boolean} => {
  const currentMajor = major(currentVersion);
  const selectedMajor = major(selectedVersion);
  const currentMinor = minor(currentVersion);
  const selectedMinor = minor(selectedVersion);
  const currentPath = patch(currentVersion);
  const selectedPath = patch(selectedVersion);

  if (
    currentMajor < selectedMajor - 1 ||
    currentMinor < selectedMinor - 1 ||
    currentPath < selectedPath - 1
  ) {
    console.log(
      `There may have been breaking changes your ${displayHint} ${yellow(
        `v${currentVersion}`
      )} and selected version ${yellow(`v${selectedVersion}`)}.\nPlease upgrade iteratively.`
    );

    return {canUpgrade: false};
  }

  return {canUpgrade: true};
};

const upgradeSatelliteRelease = async (satellite: SatelliteParameters) => {
  const currentVersion = await satelliteVersion({
    satellite
  });

  const displayHint = `satellite "${satelliteKey(satellite.satelliteId ?? '')}"`;
  const asset = await selectAsset({currentVersion, assetKey: SATELLITE_WASM_NAME, displayHint});

  if (asset === undefined) {
    return;
  }

  const upgradeSatelliteWasm = async ({wasm_module}: {wasm_module: Array<number>}) =>
    upgradeSatelliteAdmin({
      satellite,
      wasm_module,
      // TODO: option to be removed
      deprecated: compare(currentVersion, '0.0.7') < 0,
      deprecatedNoScope: compare(currentVersion, '0.0.9') < 0
    });

  await upgradeWasmGitHub({asset, upgrade: upgradeSatelliteWasm});
};

const upgradeSatelliteCustom = async ({
  satellite,
  args
}: {
  satellite: SatelliteParameters;
  args?: string[];
}) => {
  const src = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});

  if (src === undefined) {
    console.log(`${red('No source file provided.')}`);
    return;
  }

  // TODO: option to be removed
  const currentVersion = await satelliteVersion({
    satellite
  });

  const upgradeSatelliteWasm = async ({wasm_module}: {wasm_module: Array<number>}) =>
    upgradeSatelliteAdmin({
      satellite,
      wasm_module,
      // TODO: option to be removed
      deprecated: compare(currentVersion, '0.0.7') < 0,
      deprecatedNoScope: compare(currentVersion, '0.0.9') < 0
    });

  await upgradeWasmLocal({src, upgrade: upgradeSatelliteWasm});
};

const updateMissionControlRelease = async (missionControlParameters: MissionControlParameters) => {
  const currentVersion = await missionControlVersion({
    missionControl: missionControlParameters
  });

  const displayHint = `mission control`;
  const asset = await selectAsset({
    currentVersion,
    assetKey: MISSION_CONTROL_WASM_NAME,
    displayHint
  });

  if (asset === undefined) {
    return;
  }

  const upgradeMissionControlWasm = async ({wasm_module}: {wasm_module: Array<number>}) =>
    upgradeMissionControlAdmin({
      missionControl: missionControlParameters,
      wasm_module
    });

  await upgradeWasmGitHub({asset, upgrade: upgradeMissionControlWasm});
};

const upgradeMissionControlCustom = async ({
  missionControlParameters,
  args
}: {
  missionControlParameters: MissionControlParameters;
  args?: string[];
}) => {
  const src = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});

  if (src === undefined) {
    console.log(`${red('No source file provided.')}`);
    return;
  }

  const upgradeMissionControlWasm = async ({wasm_module}: {wasm_module: Array<number>}) =>
    upgradeMissionControlAdmin({
      missionControl: missionControlParameters,
      wasm_module
    });

  await upgradeWasmLocal({src, upgrade: upgradeMissionControlWasm});
};

const selectAsset = async ({
  currentVersion,
  assetKey,
  displayHint
}: {
  currentVersion: string;
  assetKey: 'satellite' | 'mission_control';
  displayHint: string;
}): Promise<GitHubAsset | undefined> => {
  const releases = await githubJunoReleases();

  if (releases === undefined) {
    console.log(`${red('Cannot fetch GitHub repo releases 😢.')}`);
    return undefined;
  }

  const releasesWithAssets = releases.filter(
    ({assets}) => assets?.find(({name}) => name.includes(assetKey)) !== undefined
  );

  if (releasesWithAssets.length === 0) {
    console.log(`${red('No assets has been released. Reach out Juno❗')}`);
    return undefined;
  }

  const newerReleases = releasesWithAssets
    .filter(({assets}) => {
      const asset = assets?.find(({name}) => name.includes(assetKey));

      if (asset === undefined) {
        return false;
      }

      const version = coerce(asset.name)?.format();

      if (version === undefined) {
        return false;
      }

      return compare(currentVersion, version) === -1;
    })
    .reduce((acc, release) => {
      const findAssetVersion = ({assets}: GitHubRelease): SemVer | null => {
        const asset = assets?.find(({name}) => name.includes(assetKey));
        return coerce(asset?.name ?? '');
      };

      // We want to display the asset release with the lowest global release!
      // e.g. if satellite v0.0.2 is present in Juno v0.0.4 and v0.0.5, we want to present "Satellite v0.0.2 (Juno v0.0.4)"

      // There is a release in the accumulator with a same asset version but a global version lower
      // e.g. accumulator has satellite v0.0.2 in Juno v0.0.10 but release is Juno v0.0.11 with same satellite v0.0.2
      if (
        acc.find((existing) => {
          const version = findAssetVersion(release);
          const existingVersion = findAssetVersion(existing);

          return (
            eq(version?.raw ?? '', existingVersion?.raw ?? '') &&
            lt(existing.tag_name, release.tag_name)
          );
        }) !== undefined
      ) {
        return acc;
      }

      // There is a release in the accumulator with a same asset version but a global version newer
      // e.g. accumulator has satellite v0.0.2 in Juno v0.0.12 but release is Juno v0.0.11 with same satellite v0.0.2
      const existingIndex = acc.findIndex((existing) => {
        const version = findAssetVersion(release);
        const existingVersion = findAssetVersion(existing);

        return (
          eq(version?.raw ?? '', existingVersion?.raw ?? '') &&
          gt(existing.tag_name, release.tag_name)
        );
      });

      if (existingIndex !== undefined) {
        return [...acc.filter((_, index) => index !== existingIndex), release];
      }

      return [...acc, release];
    }, [] as GitHubRelease[]);

  if (newerReleases.length === 0) {
    console.log(`No newer releases are available at the moment.`);
    return undefined;
  }

  const asset = await promptReleases({
    githubReleases: newerReleases,
    assetKey
  });

  if (asset === undefined) {
    console.log(`${red('No asset has been released for the selected version. Reach out Juno❗️')}`);
    return undefined;
  }

  const selectedVersion = coerce(asset.name)?.format();

  if (selectedVersion === undefined) {
    console.log(`${red('No version can be extracted from the asset. Reach out Juno❗️')}`);
    return undefined;
  }

  const {canUpgrade} = checkVersion({displayHint, currentVersion, selectedVersion});

  if (!canUpgrade) {
    return undefined;
  }

  return asset;
};
