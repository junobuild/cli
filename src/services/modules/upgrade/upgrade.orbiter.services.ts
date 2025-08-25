import type {PrincipalText} from '@dfinity/zod-schemas';
import {orbiterVersion, upgradeOrbiter as upgradeOrbiterAdmin} from '@junobuild/admin';
import {hasArgs, nextArg} from '@junobuild/cli-tools';
import type {OrbiterParameters} from '@junobuild/ic-client/actor';
import {cyan, red} from 'kleur';
import {actorParameters} from '../../../api/actor.api';
import {getCliOrbiters} from '../../../configs/cli.config';
import {ORBITER_WASM_NAME} from '../../../constants/constants';
import type {UpgradeWasmModule} from '../../../types/upgrade';
import {NEW_CMD_LINE} from '../../../utils/prompt.utils';
import {orbiterKey} from '../../../utils/satellite.utils';
import {logUpgradeResult, readUpgradeOptions} from '../../../utils/upgrade.utils';
import {
  confirmReset,
  selectVersion,
  upgradeWasmJunoCdn,
  upgradeWasmLocal
} from './upgrade.services';

type Orbiter = Omit<OrbiterParameters, 'orbiterId'> & {orbiterId: PrincipalText};

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

    const logResult = (result: {success: boolean; err?: unknown}) => {
      logUpgradeResult({...result, successMessage: 'Orbiter successfully upgraded.'});
    };

    if (hasArgs({args, options: ['-s', '--src']})) {
      const result = await upgradeOrbiterCustom({args, orbiterParameters});

      logResult(result);
      return;
    }

    const result = await updateOrbiterRelease(orbiterParameters);

    logResult(result);
  };

  for (const orbiter of authOrbiters) {
    await upgradeOrbiter(orbiter.p);
  }
};

const upgradeOrbiterCustom = async ({
  orbiterParameters,
  args
}: {
  orbiterParameters: Orbiter;
  args?: string[];
}): Promise<{success: boolean; err?: unknown}> => {
  const src = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});

  if (src === undefined) {
    console.log(red('No source file provided.'));
    return {success: false};
  }

  const reset = await confirmReset({args, assetKey: 'orbiter'});

  const {noSnapshot, preClearChunks} = readUpgradeOptions(args);

  const upgradeOrbiterWasm = async (params: UpgradeWasmModule) => {
    await upgradeOrbiterAdmin({
      orbiter: orbiterParameters,
      ...params,
      ...(reset && {reset}),
      preClearChunks,
      ...(noSnapshot && {takeSnapshot: false})
    });
  };

  return await upgradeWasmLocal({
    src,
    assetKey: 'orbiter',
    moduleId: orbiterParameters.orbiterId,
    upgrade: upgradeOrbiterWasm,
    reset
  });
};

const updateOrbiterRelease = async ({
  args,
  ...orbiterParameters
}: Orbiter & {args?: string[]}): Promise<{
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

  const {noSnapshot, preClearChunks} = readUpgradeOptions(args);

  const upgradeOrbiterWasm = async (params: UpgradeWasmModule) => {
    await upgradeOrbiterAdmin({
      orbiter: orbiterParameters,
      ...params,
      ...(reset && {reset}),
      preClearChunks,
      ...(noSnapshot && {takeSnapshot: false})
    });
  };

  return await upgradeWasmJunoCdn({
    version,
    assetKey: 'orbiter',
    moduleId: orbiterParameters.orbiterId,
    upgrade: upgradeOrbiterWasm,
    reset
  });
};
