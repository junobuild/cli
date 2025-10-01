import {nextArg} from '@junobuild/cli-tools';
import {red} from 'kleur';
import {logHelpSnapshot} from '../help/snapshot.help';
import {
  createSnapshotMissionControl,
  deleteSnapshotMissionControl,
  downloadSnapshotMissionControl,
  restoreSnapshotMissionControl,
  uploadSnapshotMissionControl
} from '../services/modules/snapshot/snapshot.mission-control.services';
import {
  createSnapshotOrbiter,
  deleteSnapshotOrbiter,
  downloadSnapshotOrbiter,
  restoreSnapshotOrbiter,
  uploadSnapshotOrbiter
} from '../services/modules/snapshot/snapshot.orbiter.services';
import {
  createSnapshotSatellite,
  deleteSnapshotSatellite,
  downloadSnapshotSatellite,
  restoreSnapshotSatellite,
  uploadSnapshotSatellite
} from '../services/modules/snapshot/snapshot.satellite.services';
import {logHelpSnapshotUpload} from '../help/snapshot.upload.help';

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
    case 'download':
      await executeSnapshotFn({
        args,
        satelliteFn: downloadSnapshotSatellite,
        missionControlFn: downloadSnapshotMissionControl,
        orbiterFn: downloadSnapshotOrbiter
      });
      break;
    case 'upload':
      await executeSnapshotFn({
        args,
        satelliteFn: uploadSnapshotSatellite,
        missionControlFn: uploadSnapshotMissionControl,
        orbiterFn: uploadSnapshotOrbiter
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
  satelliteFn: (args?: string[]) => Promise<void>;
  missionControlFn: (args?: string[]) => Promise<void>;
  orbiterFn: (args?: string[]) => Promise<void>;
}) => {
  const target = nextArg({args, option: '-t'}) ?? nextArg({args, option: '--target'});

  switch (target) {
    case 's':
    case 'satellite':
      await satelliteFn(args);
      break;
    case 'm':
    case 'mission-control':
      await missionControlFn(args);
      break;
    case 'o':
    case 'orbiter':
      await orbiterFn(args);
      break;
    default:
      console.log(red('Unknown target.'));
      logHelpSnapshot(args);
  }
};

export const helpSnapshot = (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'upload':
      logHelpSnapshotUpload(args);
      break;
    default:
      logHelpSnapshot(args);
  }
}