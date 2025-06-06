import {nextArg} from '@junobuild/cli-tools';
import {red} from 'kleur';
import {logHelpUpgrade} from '../help/upgrade.help';
import {upgradeMissionControl} from '../services/modules/upgrade/upgrade.mission-control.services';
import {upgradeOrbiters} from '../services/modules/upgrade/upgrade.orbiter.services';
import {upgradeSatellite} from '../services/modules/upgrade/upgrade.satellite.services';

export const upgrade = async (args?: string[]) => {
  const target = nextArg({args, option: '-t'}) ?? nextArg({args, option: '--target'});

  switch (target) {
    case 's':
    case 'satellite':
      await upgradeSatellite(args);
      break;
    case 'm':
    case 'mission-control':
      await upgradeMissionControl(args);
      break;
    case 'o':
    case 'orbiter':
      await upgradeOrbiters(args);
      break;
    default:
      console.log(red('Unknown target.'));
      logHelpUpgrade();
  }
};
