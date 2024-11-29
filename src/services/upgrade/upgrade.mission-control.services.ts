import {
  missionControlVersion,
  upgradeMissionControl as upgradeMissionControlAdmin,
  type MissionControlParameters
} from '@junobuild/admin';
import {hasArgs, nextArg} from '@junobuild/cli-tools';
import {isNullish} from '@junobuild/utils';
import {cyan, red} from 'kleur';
import {actorParameters} from '../../api/actor.api';
import {getCliMissionControl} from '../../configs/cli.config';
import {MISSION_CONTROL_WASM_NAME} from '../../constants/constants';
import type {UpgradeWasmModule} from '../../types/upgrade';
import {NEW_CMD_LINE} from '../../utils/prompt.utils';
import {
  consoleUpgradeResult,
  selectVersion,
  upgradeWasmCdn,
  upgradeWasmLocal
} from './upgrade.services';

export const upgradeMissionControl = async (args?: string[]) => {
  const missionControl = await getCliMissionControl();

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
    ...(await actorParameters())
  };

  const consoleResult = (result: {success: boolean; err?: unknown}) => {
    consoleUpgradeResult({...result, successMessage: 'Mission control successfully upgraded.'});
  };

  if (hasArgs({args, options: ['-s', '--src']})) {
    const result = await upgradeMissionControlCustom({args, missionControlParameters});

    consoleResult(result);
    return;
  }

  const result = await updateMissionControlRelease({args, missionControlParameters});

  consoleResult(result);
};

const updateMissionControlRelease = async ({
  args,
  missionControlParameters
}: {
  args?: string[];
  missionControlParameters: MissionControlParameters;
}): Promise<{success: boolean; err?: unknown}> => {
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
    return {success: false};
  }

  const preClearChunks = hasArgs({args, options: ['-cc', '--clear-chunks']});

  const upgradeMissionControlWasm = async (params: UpgradeWasmModule) => {
    await upgradeMissionControlAdmin({
      missionControl: missionControlParameters,
      preClearChunks,
      ...params
    });
  };

  return await upgradeWasmCdn({
    version,
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
}): Promise<{success: boolean; err?: unknown}> => {
  const src = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});

  if (src === undefined) {
    console.log(`${red('No source file provided.')}`);
    return {success: false};
  }

  const preClearChunks = hasArgs({args, options: ['-cc', '--clear-chunks']});

  const upgradeMissionControlWasm = async (params: UpgradeWasmModule) => {
    await upgradeMissionControlAdmin({
      missionControl: missionControlParameters,
      preClearChunks,
      ...params
    });
  };

  return await upgradeWasmLocal({
    src,
    assetKey: 'mission_control',
    upgrade: upgradeMissionControlWasm
  });
};
