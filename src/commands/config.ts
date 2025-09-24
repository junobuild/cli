import {red} from 'kleur';
import {logHelpConfigApply} from '../help/config.apply.help';
import {logHelpConfig} from '../help/config.help';
import {logHelpConfigInit} from '../help/config.init.help';
import {applyConfig} from '../services/config/apply.services';
import {init} from '../services/config/init.services';

export const config = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'apply':
      await applyConfig(args);
      break;
    case 'init':
      await init(args);
      break;
    default:
      console.log(red('Unknown subcommand.'));
      logHelpConfig(args);
  }
};

export const helpConfig = (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'apply':
      logHelpConfigApply(args);
      break;
    case 'init':
      logHelpConfigInit(args);
      break;
    default:
      logHelpConfig(args);
  }
};
