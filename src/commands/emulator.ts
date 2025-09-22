import {red} from 'kleur';
import {logHelpEmulator} from '../help/emulator.help';
import {logHelpEmulatorStart} from '../help/emulator.start.help';
import {logHelpEmulatorWait} from '../help/emulator.wait.help';
import {start} from '../services/emulator/start.services';
import {stop} from '../services/emulator/stop.services';
import {wait} from '../services/emulator/wait.services';

export const emulator = async (args?: string[]) => {
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
    default:
      console.log(red('Unknown subcommand.'));
      logHelpEmulator(args);
  }
};

export const helpEmulator = (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'start':
      logHelpEmulatorStart(args);
      break;
    case 'wait':
      logHelpEmulatorWait(args);
      break;
    default:
      logHelpEmulator(args);
  }
};
