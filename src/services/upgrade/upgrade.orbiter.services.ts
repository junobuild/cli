import {
  orbiterVersion,
  upgradeOrbiter as upgradeOrbiterAdmin,
  type OrbiterParameters
} from '@junobuild/admin';
import {hasArgs, nextArg} from '@junobuild/cli-tools';
import {cyan, red} from 'kleur';
import {getCliOrbiters} from '../../configs/cli.config';
import {ORBITER_WASM_NAME} from '../../constants/constants';
import type {UpgradeWasmModule} from '../../types/upgrade';
import {actorParameters} from '../../utils/actor.utils';
import {NEW_CMD_LINE} from '../../utils/prompt.utils';
import {orbiterKey} from '../../utils/satellite.utils';
import {
  confirmReset,
  consoleUpgradeResult,
  selectVersion,
  upgradeWasmCdn,
  upgradeWasmLocal
} from './upgrade.services';

export const upgradeOrbiters = async (args?: string[]) => {
  const authOrbiters = await getCliOrbiters();

  if (authOrbiters === undefined || authOrbiters.length === 0) {
    return;
  }

  const upgradeOrbiter = async (orbiterId: string) => {
    console.log(`${NEW_CMD_LINE}Initiating upgrade for Orbiter ${cyan(orbiterId)}.${NEW_CMD_LINE}`);

    const orbiterParameters = {
      orbiterId,
      ...(await actorParameters())
    };

    const consoleResult = (result: {success: boolean; err?: unknown}) => {
      consoleUpgradeResult({...result, successMessage: 'Orbiter successfully upgraded.'});
    };

    if (hasArgs({args, options: ['-s', '--src']})) {
      const result = await upgradeOrbiterCustom({args, orbiterParameters});

      consoleResult(result);
      return;
    }

    const result = await updateOrbiterRelease(orbiterParameters);

    consoleResult(result);
  };

  for (const orbiter of authOrbiters) {
    await upgradeOrbiter(orbiter.p);
  }
};

const upgradeOrbiterCustom = async ({
  orbiterParameters,
  args
}: {
  orbiterParameters: OrbiterParameters;
  args?: string[];
}): Promise<{success: boolean; err?: unknown}> => {
  const src = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});

  if (src === undefined) {
    console.log(`${red('No source file provided.')}`);
    return {success: false};
  }

  const reset = await confirmReset({args, assetKey: 'orbiter'});

  const nocheck = hasArgs({args, options: ['-n', '--nocheck']});
  const preClearChunks = hasArgs({args, options: ['-c', '--clear-chunks']});

  const upgradeOrbiterWasm = async (params: UpgradeWasmModule) => {
    await upgradeOrbiterAdmin({
      orbiter: orbiterParameters,
      ...params,
      ...(reset && {reset}),
      preClearChunks
    });
  };

  return await upgradeWasmLocal({src, nocheck, upgrade: upgradeOrbiterWasm, reset});
};

const updateOrbiterRelease = async ({
  args,
  ...orbiterParameters
}: Required<Pick<OrbiterParameters, 'orbiterId'>> &
  Omit<OrbiterParameters, 'orbiterId'> & {args?: string[]}): Promise<{
  success: boolean;
  err?: unknown;
}> => {
  const currentVersion = await orbiterVersion({
    orbiter: orbiterParameters
  });

  const displayHint = `orbiter "${await orbiterKey(orbiterParameters.orbiterId)}"`;
  const version = await selectVersion({
    currentVersion,
    assetKey: ORBITER_WASM_NAME,
    displayHint
  });

  if (version === undefined) {
    return {success: false};
  }

  const reset = await confirmReset({args, assetKey: 'orbiter'});

  const nocheck = hasArgs({args, options: ['-n', '--nocheck']});
  const preClearChunks = hasArgs({args, options: ['-c', '--clear-chunks']});

  const upgradeOrbiterWasm = async (params: UpgradeWasmModule) => {
    await upgradeOrbiterAdmin({
      orbiter: orbiterParameters,
      ...params,
      ...(reset && {reset}),
      preClearChunks
    });
  };

  return await upgradeWasmCdn({
    version,
    assetKey: 'orbiter',
    upgrade: upgradeOrbiterWasm,
    reset,
    nocheck
  });
};
