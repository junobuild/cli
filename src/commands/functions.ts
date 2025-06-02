import {red} from 'kleur';
import {logHelpFunctionsBuild} from '../help/functions.build.help';
import {logHelpFunctionsEject} from '../help/functions.eject.help';
import {logHelpFunctions} from '../help/functions.help';
import {build} from '../services/functions/build/build.services';
import {eject} from '../services/functions/eject/eject.services';

export const functions = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'eject':
      await eject(args);
      break;
    case 'build':
      await build(args);
      break;
    default:
      console.log(red('Unknown subcommand.'));
      logHelpFunctions(args);
  }
};

export const helpFunctions = (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'build':
      logHelpFunctionsBuild(args);
      break;
    case 'eject':
      logHelpFunctionsEject(args);
      break;
    default:
      logHelpFunctions(args);
  }
};
