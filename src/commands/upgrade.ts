import {red} from 'kleur';
import {upgradeMissionControl} from '../services/upgrade/upgrade.mission-control.services';
import {upgradeOrbiters} from '../services/upgrade/upgrade.orbiter.services';
import {upgradeSatellite} from '../services/upgrade/upgrade.satellite.services';
import {helpUpgrade} from './help';

export const upgrade = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
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
      console.log(`${red('Unknown subcommand.')}`);
      console.log(helpUpgrade);
  }
};
