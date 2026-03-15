import {red} from 'kleur';
import {logHelpHostingClear} from '../help/hosting.clear.help';
import {logHelpHostingDeploy} from '../help/hosting.deploy.help';
import {logHelpHosting} from '../help/hosting.help';
import {logHelpHostingPrune} from '../help/hosting.prune.help';
import {clear} from '../services/assets/clear.services';
import {deploy} from '../services/assets/deploy.services';
import {prune} from '../services/assets/prune.services';

export const hosting = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'deploy':
      await deploy(args);
      break;
    case 'clear':
      await clear(args);
      break;
    case 'prune':
      await prune(args);
      break;
    default:
      console.log(red('Unknown subcommand.'));
      logHelpHosting(args);
  }
};

export const helpHosting = (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'deploy':
      logHelpHostingDeploy(args);
      break;
    case 'clear':
      logHelpHostingClear(args);
      break;
    case 'prune':
      logHelpHostingPrune(args);
      break;
    default:
      logHelpHosting(args);
  }
};
