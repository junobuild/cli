import {red} from 'kleur';
import {build} from '../services/build.services';
import {eject} from '../services/eject.services';
import {helpDev} from './help';

export const dev = async (args?: string[]) => {
  const [subCommand, options] = args ?? [];

  switch (subCommand) {
    case 'eject':
      await eject();
      break;
    case 'build':
      await build();
      break;
    default:
      console.log(`${red('Unknown command.')}`);
      console.log(helpDev);
  }
};
