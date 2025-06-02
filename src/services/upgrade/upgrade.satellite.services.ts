import {isNullish} from '@dfinity/utils';
import {
  listCustomDomains,
  satelliteVersion,
  upgradeSatellite as upgradeSatelliteAdmin,
  type SatelliteParameters
} from '@junobuild/admin';
import {hasArgs, nextArg} from '@junobuild/cli-tools';
import {cyan, red} from 'kleur';
import {compare} from 'semver';
import {SATELLITE_WASM_NAME} from '../../constants/constants';
import type {AssertWasmModule, UpgradeWasm, UpgradeWasmModule} from '../../types/upgrade';
import {NEW_CMD_LINE} from '../../utils/prompt.utils';
import {assertConfigAndLoadSatelliteContext, satelliteKey} from '../../utils/satellite.utils';
import {readUpgradeOptions} from '../../utils/upgrade.utils';
import {assertSatelliteBuildType} from './upgrade-assert.services';
import {
  confirmReset,
  consoleUpgradeResult,
  redoCustomDomains,
  selectVersion,
  upgradeWasmCdn,
  upgradeWasmLocal
} from './upgrade.services';

export const upgradeSatellite = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);
  const {satelliteId} = satellite;

  console.log(
    `${NEW_CMD_LINE}Initiating upgrade for satellite ${cyan(satelliteId)}.${NEW_CMD_LINE}`
  );

  const consoleResult = (result: {success: boolean; err?: unknown}) => {
    consoleUpgradeResult({...result, successMessage: 'Satellite successfully upgraded.'});
  };

  if (hasArgs({args, options: ['-s', '--src']})) {
    const result = await upgradeSatelliteCustom({satellite, args});

    consoleResult(result);
    return;
  }

  const result = await upgradeSatelliteRelease({satellite, args});

  consoleResult(result);
};

const upgradeSatelliteCustom = async ({
  satellite,
  args
}: {
  satellite: SatelliteParameters;
  args?: string[];
}): Promise<{success: boolean; err?: unknown}> => {
  const src = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});

  if (src === undefined) {
    console.log(red('No source file provided.'));
    return {success: false};
  }

  // TODO: option to be removed
  const currentVersion = await satelliteVersion({
    satellite
  });

  const {noSnapshot, preClearChunks} = readUpgradeOptions(args);

  const upgrade = async (
    params: Pick<UpgradeWasm, 'upgrade' | 'reset' | 'assert'>
  ): Promise<{success: boolean; err?: unknown}> => {
    return await upgradeWasmLocal({src, assetKey: 'satellite', ...params});
  };

  return await executeUpgradeSatellite({
    satellite,
    args,
    currentVersion,
    preClearChunks,
    noSnapshot,
    upgrade
  });
};

const upgradeSatelliteRelease = async ({
  satellite,
  args
}: {
  satellite: SatelliteParameters;
  args?: string[];
}): Promise<{success: boolean; err?: unknown}> => {
  const currentVersion = await satelliteVersion({
    satellite
  });

  const displayHint = `satellite "${await satelliteKey(satellite.satelliteId ?? '')}"`;
  const version = await selectVersion({currentVersion, assetKey: SATELLITE_WASM_NAME, displayHint});

  if (isNullish(version)) {
    return {success: false};
  }

  const {noSnapshot, preClearChunks} = readUpgradeOptions(args);

  const upgrade = async (
    params: Pick<UpgradeWasm, 'upgrade' | 'reset' | 'assert'>
  ): Promise<{success: boolean; err?: unknown}> => {
    return await upgradeWasmCdn({version, assetKey: 'satellite', ...params});
  };

  return await executeUpgradeSatellite({
    satellite,
    args,
    currentVersion,
    preClearChunks,
    noSnapshot,
    upgrade
  });
};

const executeUpgradeSatellite = async ({
  satellite,
  args,
  currentVersion,
  upgrade,
  preClearChunks,
  noSnapshot
}: {
  satellite: SatelliteParameters;
  args?: string[];
  currentVersion: string;
  preClearChunks: boolean;
  noSnapshot: boolean;
  upgrade: (
    params: Pick<UpgradeWasm, 'upgrade' | 'reset' | 'assert'>
  ) => Promise<{success: boolean; err?: unknown}>;
}): Promise<{success: boolean; err?: unknown}> => {
  const reset = await confirmReset({args, assetKey: 'satellite'});

  // Information we want to try to redo once the satellite has been updated and resetted
  const customDomains = reset ? await listCustomDomains({satellite}) : [];

  const upgradeSatelliteWasm = async (params: UpgradeWasmModule) => {
    await upgradeSatelliteAdmin({
      satellite,
      ...params,
      // TODO: option to be removed
      deprecated: compare(currentVersion, '0.0.7') < 0,
      deprecatedNoScope: compare(currentVersion, '0.0.9') < 0,
      ...(reset && {reset}),
      preClearChunks,
      ...(noSnapshot && {takeSnapshot: false})
    });
  };

  const assert = async (params: AssertWasmModule) => {
    await assertSatelliteBuildType({satellite, ...params});
  };

  const {success, err} = await upgrade({
    upgrade: upgradeSatelliteWasm,
    reset,
    assert
  });

  if (!success) {
    return {success, err};
  }

  try {
    if (reset && customDomains.length > 0) {
      await redoCustomDomains({satellite, domains: customDomains});
    }
  } catch (err) {
    return {success: false, err};
  }

  return {success: true};
};
