import {
  missionControlVersion,
  upgradeMissionControl as upgradeMissionControlAdmin,
  type MissionControlParameters
} from '@junobuild/admin';
import {isNullish} from '@junobuild/utils';
import {cyan, red} from 'kleur';
import {getCliMissionControl} from '../../configs/cli.config';
import {MISSION_CONTROL_WASM_NAME} from '../../constants/constants';
import {actorParameters} from '../../utils/actor.utils';
import {hasArgs, nextArg} from '../../utils/args.utils';
import {NEW_CMD_LINE} from '../../utils/prompt.utils';
import {selectVersion, upgradeWasmCdn, upgradeWasmLocal} from './upgrade.services';

export const upgradeMissionControl = async (args?: string[]) => {
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
