import {red} from 'kleur';
import {build} from '../services/build.services';
import {start, stop} from '../services/docker.services';
import {eject} from '../services/eject.services';
import {helpDev} from './help';

export const dev = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'eject':
      await eject();
      break;
    case 'build':
      await build();
      break;
    case 'start':
      await start();
      break;
    case 'stop':
      await stop();
      break;
    default:
      console.log(`${red('Unknown subcommand.')}`);
      console.log(helpDev);
  }
};
