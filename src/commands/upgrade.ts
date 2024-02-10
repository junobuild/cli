import {
  checkUpgradeVersion,
  listCustomDomains,
  missionControlVersion,
  orbiterVersion,
  satelliteVersion,
  upgradeMissionControl as upgradeMissionControlAdmin,
  upgradeOrbiter as upgradeOrbiterAdmin,
  upgradeSatellite as upgradeSatelliteAdmin,
  type MissionControlParameters,
  type OrbiterParameters,
  type SatelliteParameters
} from '@junobuild/admin';
import {isNullish} from '@junobuild/utils';
import {cyan, red, yellow} from 'kleur';
import prompts from 'prompts';
import {compare} from 'semver';
import {getCliMissionControl, getCliOrbiters} from '../configs/cli.config';
import {junoConfigExist, readSatelliteConfig} from '../configs/juno.config';
import {
  MISSION_CONTROL_WASM_NAME,
  ORBITER_WASM_NAME,
  SATELLITE_WASM_NAME
} from '../constants/constants';
import {assertSatelliteBuildType} from '../services/upgrade-assert.services';
import {redoCustomDomains, upgradeWasmCdn, upgradeWasmLocal} from '../services/upgrade.services';
import type {AssetKey} from '../types/asset-key';
import type {UpgradeWasm, UpgradeWasmModule} from '../types/upgrade';
import {actorParameters} from '../utils/actor.utils';
import {hasArgs, nextArg} from '../utils/args.utils';
import {toAssetKeys} from '../utils/asset-key.utils';
import {consoleNoConfigFound} from '../utils/msg.utils';
import {NEW_CMD_LINE, confirmAndExit} from '../utils/prompt.utils';
import {orbiterKey, satelliteKey, satelliteParameters} from '../utils/satellite.utils';
import {newerReleases as newerReleasesUtils} from '../utils/upgrade.utils';
import {assertAnswerCtrlC} from './init';

export const upgrade = async (args?: string[]) => {
  if (hasArgs({args, options: ['-m', '--mission-control']})) {
    await upgradeMissionControl(args);
    return;
  }

  if (hasArgs({args, options: ['-o', '--orbiter']})) {
    await upgradeOrbiters(args);
    return;
  }

  await upgradeSatellite(args);
};

const upgradeMissionControl = async (args?: string[]) => {
  const missionControl = getCliMissionControl();

  if (isNullish(missionControl)) {
    console.log(
      `${red(
        'No mission control found.'
      )} Ignore this error if your controller does not control your mission control.`
    );
    return;
  }

  console.log(
    `${NEW_CMD_LINE}Initiating upgrade for mission control ${cyan(missionControl)}.${NEW_CMD_LINE}`
  );

  const missionControlParameters = {
    missionControlId: missionControl,
    ...actorParameters()
  };

  const consoleSuccess = () => {
    console.log(`✅ Mission control successfully upgraded.`);
  };

  if (hasArgs({args, options: ['-s', '--src']})) {
    await upgradeMissionControlCustom({args, missionControlParameters});

    consoleSuccess();
    return;
  }

  await updateMissionControlRelease({args, missionControlParameters});

  consoleSuccess();
};

const upgradeOrbiters = async (args?: string[]) => {
  const authOrbiters = getCliOrbiters();

  if (authOrbiters === undefined || authOrbiters.length === 0) {
    return;
  }

  const upgradeOrbiter = async (orbiterId: string) => {
    console.log(`${NEW_CMD_LINE}Initiating upgrade for Orbiter ${cyan(orbiterId)}.${NEW_CMD_LINE}`);

    const orbiterParameters = {
      orbiterId,
      ...actorParameters()
    };

    const consoleSuccess = () => {
      console.log(`✅ Orbiter successfully upgraded.`);
    };

    if (hasArgs({args, options: ['-s', '--src']})) {
      await upgradeOrbiterCustom({args, orbiterParameters});

      consoleSuccess();
      return;
    }

    await updateOrbiterRelease(orbiterParameters);

    consoleSuccess();
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

  console.log(
    `${NEW_CMD_LINE}Initiating upgrade for satellite ${cyan(satelliteId)}.${NEW_CMD_LINE}`
  );

  const satellite = satelliteParameters(satelliteId);

  const consoleSuccess = () => {
    console.log(`✅ Satellite successfully upgraded.`);
  };

  if (hasArgs({args, options: ['-s', '--src']})) {
    await upgradeSatelliteCustom({satellite, args});

    consoleSuccess();
    return;
  }

  await upgradeSatelliteRelease({satellite, args});

  consoleSuccess();
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

  const {version}: {version: string} = await prompts({
    type: 'select',
    name: 'version',
    message: `To which version should your ${assetKey.replace('_', ' ')} be upgraded?`,
    choices,
    initial: 0
  });

  assertAnswerCtrlC(version);

  return version;
};

const upgradeSatelliteRelease = async ({
  satellite,
  args
}: {
  satellite: SatelliteParameters;
  args?: string[];
}) => {
  const currentVersion = await satelliteVersion({
    satellite
  });

  const displayHint = `satellite "${satelliteKey(satellite.satelliteId ?? '')}"`;
  const version = await selectVersion({currentVersion, assetKey: SATELLITE_WASM_NAME, displayHint});

  if (isNullish(version)) {
    return;
  }

  const nocheck = hasArgs({args, options: ['-n', '--nocheck']});

  const upgrade = async (params: Pick<UpgradeWasm, 'upgrade' | 'reset' | 'assert'>) => {
    await upgradeWasmCdn({version, assetKey: 'satellite', nocheck, ...params});
  };

  await executeUpgradeSatellite({
    satellite,
    args,
    currentVersion,
    upgrade
  });
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

  const nocheck = hasArgs({args, options: ['-n', '--nocheck']});

  const upgrade = async (params: Pick<UpgradeWasm, 'upgrade' | 'reset' | 'assert'>) => {
    await upgradeWasmLocal({src, nocheck, ...params});
  };

  await executeUpgradeSatellite({
    satellite,
    args,
    currentVersion,
    upgrade
  });
};

const executeUpgradeSatellite = async ({
  satellite,
  args,
  currentVersion,
  upgrade
}: {
  satellite: SatelliteParameters;
  args?: string[];
  currentVersion: string;
  upgrade: (params: Pick<UpgradeWasm, 'upgrade' | 'reset' | 'assert'>) => Promise<void>;
}) => {
  const reset = await confirmReset({args, assetKey: 'satellite'});

  // Information we want to try to redo once the satellite has been updated and resetted
  const customDomains = reset ? await listCustomDomains({satellite}) : [];

  const upgradeSatelliteWasm = async ({wasm_module}: UpgradeWasmModule) => {
    await upgradeSatelliteAdmin({
      satellite,
      wasm_module,
      // TODO: option to be removed
      deprecated: compare(currentVersion, '0.0.7') < 0,
      deprecatedNoScope: compare(currentVersion, '0.0.9') < 0,
      ...(reset && {reset})
    });
  };

  const assert = async (params: UpgradeWasmModule) => {
    await assertSatelliteBuildType({satellite, ...params});
  };

  await upgrade({
    upgrade: upgradeSatelliteWasm,
    reset,
    assert
  });

  if (reset && customDomains.length > 0) {
    await redoCustomDomains({satellite, domains: customDomains});
  }
};

const updateMissionControlRelease = async ({
  args,
  missionControlParameters
}: {
  args?: string[];
  missionControlParameters: MissionControlParameters;
}) => {
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

  const nocheck = hasArgs({args, options: ['-n', '--nocheck']});

  const upgradeMissionControlWasm = async ({wasm_module}: {wasm_module: Uint8Array}) => {
    await upgradeMissionControlAdmin({
      missionControl: missionControlParameters,
      wasm_module
    });
  };

  await upgradeWasmCdn({
    version,
    nocheck,
    assetKey: 'mission_control',
    upgrade: upgradeMissionControlWasm
  });
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

  const nocheck = hasArgs({args, options: ['-n', '--nocheck']});

  const upgradeMissionControlWasm = async ({wasm_module}: {wasm_module: Uint8Array}) => {
    await upgradeMissionControlAdmin({
      missionControl: missionControlParameters,
      wasm_module
    });
  };

  await upgradeWasmLocal({src, nocheck, upgrade: upgradeMissionControlWasm});
};

const updateOrbiterRelease = async ({
  args,
  ...orbiterParameters
}: Required<Pick<OrbiterParameters, 'orbiterId'>> &
  Omit<OrbiterParameters, 'orbiterId'> & {args?: string[]}) => {
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

  const reset = await confirmReset({args, assetKey: 'orbiter'});
  const nocheck = hasArgs({args, options: ['-n', '--nocheck']});

  const upgradeOrbiterWasm = async ({wasm_module}: {wasm_module: Uint8Array}) => {
    await upgradeOrbiterAdmin({
      orbiter: orbiterParameters,
      wasm_module,
      ...(reset && {reset})
    });
  };

  await upgradeWasmCdn({version, assetKey: 'orbiter', upgrade: upgradeOrbiterWasm, reset, nocheck});
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

  const reset = await confirmReset({args, assetKey: 'orbiter'});

  const nocheck = hasArgs({args, options: ['-n', '--nocheck']});

  const upgradeOrbiterWasm = async ({wasm_module}: {wasm_module: Uint8Array}) => {
    await upgradeOrbiterAdmin({
      orbiter: orbiterParameters,
      wasm_module,
      ...(reset && {reset})
    });
  };

  await upgradeWasmLocal({src, nocheck, upgrade: upgradeOrbiterWasm, reset});
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
    console.log(`Currently, there are no new releases available.`);
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

const confirmReset = async ({
  args,
  assetKey
}: {
  args?: string[];
  assetKey: AssetKey;
}): Promise<boolean> => {
  const reset = hasArgs({args, options: ['-r', '--reset']});

  if (!reset) {
    return false;
  }

  await confirmAndExit(
    `⚠️  Are you absolutely sure you want to upgrade and reset (❗️) your ${assetKey.replace(
      '_',
      ' '
    )} to its initial state?`
  );

  return true;
};
