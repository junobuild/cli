import {
  orbiterVersion,
  upgradeOrbiter as upgradeOrbiterAdmin,
  type OrbiterParameters
} from '@junobuild/admin';
import {hasArgs, nextArg} from '@junobuild/cli-tools';
import {cyan, red} from 'kleur';
import {getCliOrbiters} from '../../configs/cli.config';
import {ORBITER_WASM_NAME} from '../../constants/constants';
import {actorParameters} from '../../utils/actor.utils';
import {NEW_CMD_LINE} from '../../utils/prompt.utils';
import {orbiterKey} from '../../utils/satellite.utils';
import {confirmReset, selectVersion, upgradeWasmCdn, upgradeWasmLocal} from './upgrade.services';

export const upgradeOrbiters = async (args?: string[]) => {
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
