import {red} from 'kleur';
import {logHelpFunctionsBuild} from '../help/functions.build.help';
import {logHelpFunctionsEject} from '../help/functions.eject.help';
import {logHelpFunctions} from '../help/functions.help';
import {logHelpFunctionsPublish} from '../help/functions.publish.help';
import {logHelpFunctionsUpgrade} from '../help/functions.upgrade.help';
import {build} from '../services/functions/build/build.services';
import {eject} from '../services/functions/eject/eject.services';
import {publish} from '../services/functions/publish.services';
import {upgradeFunctions} from '../services/functions/upgrade/upgrade.services';

export const functions = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'eject':
      await eject(args);
      break;
    case 'build':
      await build(args);
      break;
    case 'publish':
      await publish(args);
      break;
    case 'upgrade':
      await upgradeFunctions(args);
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
    case 'publish':
      logHelpFunctionsPublish(args);
      break;
    case 'upgrade':
      logHelpFunctionsUpgrade(args);
      break;
    default:
      logHelpFunctions(args);
  }
};
