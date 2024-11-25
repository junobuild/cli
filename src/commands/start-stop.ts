import {nextArg} from '@junobuild/cli-tools';
import {red} from 'kleur';
import {logHelpStart} from '../help/start.help';
import {logHelpStop} from '../help/stop.help';
import {
  startStopMissionControl,
  startStopOrbiter,
  startStopSatellite
} from '../services/start-stop.services';
import type {StartStopAction} from '../types/start-stop';

export const startStop = async ({args, action}: {args?: string[]; action: StartStopAction}) => {
  const target = nextArg({args, option: '-t'}) ?? nextArg({args, option: '--target'});

  switch (target) {
    case 's':
    case 'satellite':
      await startStopSatellite({args, action});
      break;
    case 'm':
    case 'mission-control':
      await startStopMissionControl({args, action});
      break;
    case 'o':
    case 'orbiter':
      await startStopOrbiter({args, action});
      break;
    default:
      console.log(`${red('Unknown target.')}`);

      if (action === 'stop') {
        logHelpStop(args);
        return;
      }

      logHelpStart(args);
  }
};
