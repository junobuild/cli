import {red} from 'kleur';
import {logHelpDev} from '../help/dev.help';
import {logHelpDevStart} from '../help/dev.start.help';
import {stop} from '../services/dev/start/docker.services';
import {start} from '../services/dev/start/start.services';

export const dev = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'start':
      await start(args);
      break;
    case 'stop':
      await stop();
      break;
    default:
      console.log(red('Unknown subcommand.'));
      logHelpDev(args);
  }
};

export const helpDev = (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'start':
      logHelpDevStart(args);
      break;
    default:
      logHelpDev(args);
  }
};
