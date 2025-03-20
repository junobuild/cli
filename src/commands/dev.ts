import {red} from 'kleur';
import {logHelpDev} from '../help/dev.help';
import {build} from '../services/build/build.services';
import {start, stop} from '../services/docker.services';
import {eject} from '../services/eject.services';
import { logHelpDevBuild } from "../help/dev.build.help";

export const dev = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'eject':
      await eject();
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
    default:
      logHelpDev(args);
  }
}