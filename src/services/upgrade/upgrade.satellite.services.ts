import {
  listCustomDomains,
  satelliteVersion,
  upgradeSatellite as upgradeSatelliteAdmin,
  type SatelliteParameters
} from '@junobuild/admin';
import {isNullish} from '@junobuild/utils';
import {cyan, red} from 'kleur';
import {compare} from 'semver';
import {junoConfigExist, readSatelliteConfig} from '../../configs/juno.config';
import {SATELLITE_WASM_NAME} from '../../constants/constants';
import type {UpgradeWasm, UpgradeWasmModule} from '../../types/upgrade';
import {hasArgs, nextArg} from '../../utils/args.utils';
import {configEnv} from '../../utils/config.utils';
import {consoleNoConfigFound} from '../../utils/msg.utils';
import {NEW_CMD_LINE} from '../../utils/prompt.utils';
import {satelliteKey, satelliteParameters} from '../../utils/satellite.utils';
import {assertSatelliteBuildType} from './upgrade-assert.services';
import {
  confirmReset,
  redoCustomDomains,
  selectVersion,
  upgradeWasmCdn,
  upgradeWasmLocal
} from './upgrade.services';

export const upgradeSatellite = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    consoleNoConfigFound();
    return;
  }

  const {satelliteId} = await readSatelliteConfig(configEnv(args));

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
