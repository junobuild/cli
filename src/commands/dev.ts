import {red} from 'kleur';
import {logHelpDev} from '../help/dev.help';
import {logHelpDevStart} from '../help/dev.start.help';
import {logHelpDevWait} from '../help/dev.wait.help';
import {logHelpFunctionsBuild} from '../help/functions.build.help';
import {logHelpFunctionsEject} from '../help/functions.eject.help';
import {start} from '../services/dev/start.services';
import {stop} from '../services/dev/stop.services';
import {wait} from '../services/dev/wait.services';
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
    case 'wait':
      await wait(args);
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
    case 'wait':
      logHelpDevWait(args);
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
