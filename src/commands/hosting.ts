import {red} from 'kleur';
import {logHelpEmulatorClear} from '../help/hosting.clear.help';
import {logHelpHostingDeploy} from '../help/hosting.deploy.help';
import {logHelpHosting} from '../help/hosting.help';
import {clear} from '../services/assets/clear.services';
import {deploy} from '../services/assets/deploy.services';

export const hosting = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'deploy':
      await deploy(args);
      break;
    case 'clear':
      await clear(args);
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
      logHelpEmulatorClear(args);
      break;
    default:
      logHelpHosting(args);
  }
};
