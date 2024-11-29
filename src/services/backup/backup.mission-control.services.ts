import { assertNonNullish, isNullish } from "@junobuild/utils";
import {junoConfigExist, readJunoConfig} from '../../configs/juno.config';
import {configEnv} from '../../utils/config.utils';
import {consoleNoConfigFound} from '../../utils/msg.utils';
import {satelliteParameters} from '../../utils/satellite.utils';
import {createSnapshot} from './backup.services';
import { getCliMissionControl } from "../../configs/cli.config";
import { red } from "kleur";

export const createSnapshotMissionControl = async ({args}: {args?: string[]}) => {
  const missionControl = await getCliMissionControl();

  // TODO: this can be a common assertion
  if (isNullish(missionControl)) {
    console.log(
      `${red(
        'No mission control found.'
      )} Ignore this error if your controller does not control your mission control.`
    );
    return;
  }

  await createSnapshot({
    canisterId: missionControl,
    segment: 'mission_control'
  });
};
