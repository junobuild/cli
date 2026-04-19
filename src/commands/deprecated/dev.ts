import {red} from 'kleur';
import {logHelpDev} from '../../help/deprecated/dev.help';
import {logHelpEmulatorStart} from '../../help/emulator.start.help';
import {logHelpEmulatorWait} from '../../help/emulator.wait.help';
import {logHelpFunctionsBuild} from '../../help/functions.build.help';
import {logHelpFunctionsInit} from '../../help/functions.init.help';
import {start} from '../../services/emulator/start.services';
import {stop} from '../../services/emulator/stop.services';
import {wait} from '../../services/emulator/wait.services';
import {build} from '../../services/functions/build/build.services';
import {eject} from '../../services/functions/eject/eject.services';

/**
 * @deprecated aliases for backwards compatibility
 */
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
    case 'init':
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
/**
 * @deprecated
 */
export const helpDev = (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'start':
      logHelpEmulatorStart(args);
      break;
    case 'wait':
      logHelpEmulatorWait(args);
      break;
    case 'build':
      logHelpFunctionsBuild(args);
      break;
    case 'eject':
      logHelpFunctionsInit(args);
      break;
    default:
      logHelpDev(args);
  }
};
