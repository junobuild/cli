import {nextArg} from '@junobuild/cli-tools';
import {red} from 'kleur';
import {logHelpBackup} from '../help/backup.help';
import {logHelpDev} from '../help/dev.help';
import {
  createSnapshotMissionControl,
  deleteSnapshotMissionControl,
  restoreSnapshotMissionControl
} from '../services/backup/backup.mission-control.services';
import {
  createSnapshotOrbiter,
  deleteSnapshotOrbiter,
  restoreSnapshotOrbiter
} from '../services/backup/backup.orbiter.services';
import {
  createSnapshotSatellite,
  deleteSnapshotSatellite,
  restoreSnapshotSatellite
} from '../services/backup/backup.satellite.services';

export const backup = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'create':
      await executeBackupFn({
        args,
        satelliteFn: createSnapshotSatellite,
        missionControlFn: createSnapshotMissionControl,
        orbiterFn: createSnapshotOrbiter
      });
      break;
    case 'restore':
      await executeBackupFn({
        args,
        satelliteFn: restoreSnapshotSatellite,
        missionControlFn: restoreSnapshotMissionControl,
        orbiterFn: restoreSnapshotOrbiter
      });
      break;
    case 'delete':
      await executeBackupFn({
        args,
        satelliteFn: deleteSnapshotSatellite,
        missionControlFn: deleteSnapshotMissionControl,
        orbiterFn: deleteSnapshotOrbiter
      });
      break;
    default:
      console.log(`${red('Unknown subcommand.')}`);
      logHelpDev();
  }
};

const executeBackupFn = async ({
  args,
  satelliteFn,
  missionControlFn,
  orbiterFn
}: {
  args?: string[];
  satelliteFn: (params: {args?: string[]}) => Promise<void>;
  missionControlFn: () => Promise<void>;
  orbiterFn: () => Promise<void>;
}) => {
  const target = nextArg({args, option: '-t'}) ?? nextArg({args, option: '--target'});

  switch (target) {
    case 's':
    case 'satellite':
      await satelliteFn({args});
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
      console.log(`${red('Unknown target.')}`);
      logHelpBackup(args);
  }
};
