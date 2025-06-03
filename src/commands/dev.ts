import {red} from 'kleur';
import {logHelpDev} from '../help/dev.help';
import {logHelpDevStart} from '../help/dev.start.help';
import {logHelpFunctionsBuild} from '../help/functions.build.help';
import {logHelpFunctionsEject} from '../help/functions.eject.help';
import {stop} from '../services/dev/start/docker.services';
import {start} from '../services/dev/start/start.services';
import {build} from '../services/functions/build/build.services';
import {eject} from '../services/functions/eject/eject.services';

export const dev = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'start':
      await start(args);
      break;
    case 'stop':
      await stop();
      break;
    case 'eject':
      await eject(args);
      break;
    case 'build':
      await build(args);
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
    case 'build':
      logHelpFunctionsBuild(args);
      break;
    case 'eject':
      logHelpFunctionsEject(args);
      break;
    default:
      logHelpDev(args);
  }
};
