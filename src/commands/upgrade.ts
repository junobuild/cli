import {
  OrbiterParameters,
  SatelliteParameters,
  checkUpgradeVersion,
  missionControlVersion,
  orbiterVersion,
  satelliteVersion,
  upgradeMissionControl as upgradeMissionControlAdmin,
  upgradeOrbiter as upgradeOrbiterAdmin,
  upgradeSatellite as upgradeSatelliteAdmin,
  type MissionControlParameters
} from '@junobuild/admin';
import {red, yellow} from 'kleur';
import prompts from 'prompts';
import {compare} from 'semver';
import {
  MISSION_CONTROL_WASM_NAME,
  ORBITER_WASM_NAME,
  SATELLITE_WASM_NAME
} from '../constants/constants';
import type {AssetKey} from '../types/asset-key';
import {actorParameters} from '../utils/actor.utils';
import {hasArgs, nextArg} from '../utils/args.utils';
import {toAssetKeys} from '../utils/asset-key.utils';
import {getAuthMissionControl, getAuthOrbiters} from '../utils/auth.config.utils';
import {consoleNoConfigFound} from '../utils/msg.utils';
import {junoConfigExist, readSatelliteConfig} from '../utils/satellite.config.utils';
import {orbiterKey, satelliteKey, satelliteParameters} from '../utils/satellite.utils';
import {newerReleases as newerReleasesUtils} from '../utils/upgrade.utils';
import {upgradeWasmCdn, upgradeWasmLocal} from '../utils/wasm.utils';

export const upgrade = async (args?: string[]) => {
  if (hasArgs({args, options: ['-m', '--mission-control']})) {
    await upgradeMissionControl(args);
    return;
  }

  if (hasArgs({args, options: ['-o', '--orbiter']})) {
    await upgradeMissionControl(args);
    return;
  }

  await upgradeSatellite(args);
};

const upgradeMissionControl = async (args?: string[]) => {
  const missionControl = getAuthMissionControl();

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

const upgradeOrbiters = async (args?: string[]) => {
  const authOrbiters = getAuthOrbiters();

  if (authOrbiters === undefined || authOrbiters.length === 0) {
    return;
  }

  const upgradeOrbiter = async (orbiterId: string) => {
    const orbiterParameters = {
      orbiterId,
      ...actorParameters()
    };

    if (hasArgs({args, options: ['-s', '--src']})) {
      await upgradeOrbiterCustom({args, orbiterParameters});
      return;
    }

    await updateOrbiterRelease(orbiterParameters);
  };

  for (const orbiter of authOrbiters) {
    await upgradeOrbiter(orbiter.p);
  }
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
  newerReleases,
  assetKey
}: {
  newerReleases: string[];
  assetKey: AssetKey;
}): Promise<string> => {
  const choices = newerReleases.map((release) => ({
    title: `v${release}`,
    value: release
  }));

  const {version} = await prompts({
    type: 'select',
    name: 'version',
    message: `To which version should your ${assetKey.replace('_', ' ')} be upgraded?`,
    choices,
    initial: 0
  });

  // In case of control+c
  if (version === undefined) {
    process.exit(1);
  }

  return version;
};

const upgradeSatelliteRelease = async (satellite: SatelliteParameters) => {
  const currentVersion = await satelliteVersion({
    satellite
  });

  const displayHint = `satellite "${satelliteKey(satellite.satelliteId ?? '')}"`;
  const version = await selectVersion({currentVersion, assetKey: SATELLITE_WASM_NAME, displayHint});

  if (version === undefined) {
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

  await upgradeWasmCdn({version, assetKey: 'satellite', upgrade: upgradeSatelliteWasm});
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
  const version = await selectVersion({
    currentVersion,
    assetKey: MISSION_CONTROL_WASM_NAME,
    displayHint
  });

  if (version === undefined) {
    return;
  }

  const upgradeMissionControlWasm = async ({wasm_module}: {wasm_module: Uint8Array}) =>
    upgradeMissionControlAdmin({
      missionControl: missionControlParameters,
      wasm_module
    });

  await upgradeWasmCdn({version, assetKey: 'mission_control', upgrade: upgradeMissionControlWasm});
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

const updateOrbiterRelease = async (
  orbiterParameters: Required<Pick<OrbiterParameters, 'orbiterId'>> &
    Omit<OrbiterParameters, 'orbiterId'>
) => {
  const currentVersion = await orbiterVersion({
    orbiter: orbiterParameters
  });

  const displayHint = `orbiter "${orbiterKey(orbiterParameters.orbiterId)}"`;
  const version = await selectVersion({
    currentVersion,
    assetKey: ORBITER_WASM_NAME,
    displayHint
  });

  if (version === undefined) {
    return;
  }

  const upgradeOrbiterWasm = async ({wasm_module}: {wasm_module: Uint8Array}) =>
    upgradeOrbiterAdmin({
      orbiter: orbiterParameters,
      wasm_module
    });

  await upgradeWasmCdn({version, assetKey: 'orbiter', upgrade: upgradeOrbiterWasm});
};

const upgradeOrbiterCustom = async ({
  orbiterParameters,
  args
}: {
  orbiterParameters: OrbiterParameters;
  args?: string[];
}) => {
  const src = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});

  if (src === undefined) {
    console.log(`${red('No source file provided.')}`);
    return;
  }

  const upgradeOrbiterWasm = async ({wasm_module}: {wasm_module: Uint8Array}) =>
    upgradeOrbiterAdmin({
      orbiter: orbiterParameters,
      wasm_module
    });

  await upgradeWasmLocal({src, upgrade: upgradeOrbiterWasm});
};

const selectVersion = async ({
  currentVersion,
  assetKey,
  displayHint
}: {
  currentVersion: string;
  assetKey: AssetKey;
  displayHint: string;
}): Promise<string | undefined> => {
  const {result: newerReleases, error} = await newerReleasesUtils({
    currentVersion,
    assetKeys: toAssetKeys(assetKey)
  });

  if (error !== undefined) {
    console.log(`${red(error)}`);
    return undefined;
  }

  if (newerReleases === undefined) {
    console.log(`${red('Did not find any new releases of Juno 😢.')}`);
    return undefined;
  }

  if (newerReleases.length === 0) {
    console.log(`No newer releases are available at the moment.`);
    return undefined;
  }

  const selectedVersion = await promptReleases({
    newerReleases,
    assetKey
  });

  const {canUpgrade} = checkUpgradeVersion({currentVersion, selectedVersion});

  if (!canUpgrade) {
    console.log(
      `There may have been breaking changes between your ${displayHint} ${yellow(
        `v${currentVersion}`
      )} and selected version ${yellow(`v${selectedVersion}`)}.\nPlease upgrade iteratively.`
    );

    return undefined;
  }

  return selectedVersion;
};
