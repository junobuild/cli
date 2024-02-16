import {upgradeMissionControl} from '../services/upgrade/upgrade.mission-control.services';
import {upgradeOrbiters} from '../services/upgrade/upgrade.orbiter.services';
import {upgradeSatellite} from '../services/upgrade/upgrade.satellite.services';
import {hasArgs} from '../utils/args.utils';

export const upgrade = async (args?: string[]) => {
  if (hasArgs({args, options: ['-m', '--mission-control']})) {
    await upgradeMissionControl(args);
    return;
  }

  if (hasArgs({args, options: ['-o', '--orbiter']})) {
    await upgradeOrbiters(args);
    return;
  }

  await upgradeSatellite(args);
};
