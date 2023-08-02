import {
  SatelliteParameters,
  checkUpgradeVersion,
  mapPromptReleases,
  missionControlVersion,
  newerReleases as newerReleasesServices,
  satelliteVersion,
  upgradeMissionControl as upgradeMissionControlAdmin,
  upgradeSatellite as upgradeSatelliteAdmin,
  type GitHubAsset,
  type GitHubRelease,
  type MissionControlParameters,
  type NewerReleasesParams
} from '@junobuild/admin';
import {red, yellow} from 'kleur';
import prompts from 'prompts';
import {coerce, compare} from 'semver';
import {MISSION_CONTROL_WASM_NAME, SATELLITE_WASM_NAME} from '../constants/constants';
import {actorParameters} from '../utils/actor.utils';
import {hasArgs, nextArg} from '../utils/args.utils';
import {getMissionControl} from '../utils/auth.config.utils';
import {consoleNoConfigFound} from '../utils/msg.utils';
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
    consoleNoConfigFound();
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
  const choices = mapPromptReleases({githubReleases, assetKey});

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

const upgradeSatelliteRelease = async (satellite: SatelliteParameters) => {
  const currentVersion = await satelliteVersion({
    satellite
  });

  const displayHint = `satellite "${satelliteKey(satellite.satelliteId ?? '')}"`;
  const asset = await selectAsset({currentVersion, assetKey: SATELLITE_WASM_NAME, displayHint});

  if (asset === undefined) {
    return;
  }

  const upgradeSatelliteWasm = async ({wasm_module}: {wasm_module: Uint8Array}) =>
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

  const upgradeSatelliteWasm = async ({wasm_module}: {wasm_module: Uint8Array}) =>
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

  const upgradeMissionControlWasm = async ({wasm_module}: {wasm_module: Uint8Array}) =>
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

  const upgradeMissionControlWasm = async ({wasm_module}: {wasm_module: Uint8Array}) =>
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
  displayHint: string;
} & NewerReleasesParams): Promise<GitHubAsset | undefined> => {
  const {result: newerReleases, error} = await newerReleasesServices({currentVersion, assetKey});

  if (error !== undefined) {
    console.log(`${red(error)}`);
    return undefined;
  }

  if (newerReleases === undefined) {
    console.log(`${red('Cannot fetch new releases of Juno on GitHub 😢.')}`);
    return undefined;
  }

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

  const {canUpgrade} = checkUpgradeVersion({currentVersion, selectedVersion});

  if (!canUpgrade) {
    console.log(
      `There may have been breaking changes between your ${displayHint} ${yellow(
        `v${currentVersion}`
      )} and selected version ${yellow(`v${selectedVersion}`)}.\nPlease upgrade iteratively.`
    );

    return undefined;
  }

  return asset;
};
