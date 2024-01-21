import {red} from 'kleur';
import {eject} from '../services/eject.services';
import {helpDev} from './help';

export const dev = async (args?: string[]) => {
  const [subCommand, options] = args ?? [];

  switch (subCommand) {
    case 'eject':
      await eject();
      break;
    default:
      console.log(`${red('Unknown command.')}`);
      console.log(helpDev);
  }
};
