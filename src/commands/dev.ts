import {red} from 'kleur';
import {logHelpDevBuild} from '../help/dev.build.help';
import {logHelpDevEject} from '../help/dev.eject.help';
import {logHelpDev} from '../help/dev.help';
import {build} from '../services/build/build.services';
import {start, stop} from '../services/docker.services';
import {eject} from '../services/eject/eject.services';

export const dev = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'eject':
      await eject(args);
      break;
    case 'build':
      await build(args);
      break;
    case 'start':
      await start();
      break;
    case 'stop':
      await stop();
      break;
    default:
      console.log(red('Unknown subcommand.'));
      logHelpDev();
  }
};

export const helpDev = (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'build':
      logHelpDevBuild(args);
      break;
    case 'eject':
      logHelpDevEject(args);
      break;
    default:
      logHelpDev(args);
  }
};
