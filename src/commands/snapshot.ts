import {nextArg} from '@junobuild/cli-tools';
import {red} from 'kleur';
import {logHelpSnapshot} from '../help/snapshot.help';
import {
  createSnapshotMissionControl,
  deleteSnapshotMissionControl,
  restoreSnapshotMissionControl
} from '../services/modules/snapshot/snapshot.mission-control.services';
import {
  createSnapshotOrbiter,
  deleteSnapshotOrbiter,
  restoreSnapshotOrbiter
} from '../services/modules/snapshot/snapshot.orbiter.services';
import {
  createSnapshotSatellite,
  deleteSnapshotSatellite,
  restoreSnapshotSatellite
} from '../services/modules/snapshot/snapshot.satellite.services';

export const snapshot = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'create':
      await executeSnapshotFn({
        args,
        satelliteFn: createSnapshotSatellite,
        missionControlFn: createSnapshotMissionControl,
        orbiterFn: createSnapshotOrbiter
      });
      break;
    case 'restore':
      await executeSnapshotFn({
        args,
        satelliteFn: restoreSnapshotSatellite,
        missionControlFn: restoreSnapshotMissionControl,
        orbiterFn: restoreSnapshotOrbiter
      });
      break;
    case 'delete':
      await executeSnapshotFn({
        args,
        satelliteFn: deleteSnapshotSatellite,
        missionControlFn: deleteSnapshotMissionControl,
        orbiterFn: deleteSnapshotOrbiter
      });
      break;
    default:
      console.log(red('Unknown subcommand.'));
      logHelpSnapshot(args);
  }
};

const executeSnapshotFn = async ({
  args,
  satelliteFn,
  missionControlFn,
  orbiterFn
}: {
  args?: string[];
  satelliteFn: () => Promise<void>;
  missionControlFn: () => Promise<void>;
  orbiterFn: () => Promise<void>;
}) => {
  const target = nextArg({args, option: '-t'}) ?? nextArg({args, option: '--target'});

  switch (target) {
    case 's':
    case 'satellite':
      await satelliteFn();
      break;
    case 'm':
    case 'mission-control':
      await missionControlFn();
      break;
    case 'o':
    case 'orbiter':
      await orbiterFn();
      break;
    default:
      console.log(red('Unknown target.'));
      logHelpSnapshot(args);
  }
};
