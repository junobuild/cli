import {red} from 'kleur';
import {logHelpVersion} from '../help/version.help';
import {enableDisableVersionCheck} from '../services/version/version.check.services';
import {printVersion} from '../services/version/version.print.services';

export const logVersion = async () => {
  await printVersion();
};

export const version = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'check':
      await enableDisableVersionCheck();
      break;
    default:
      console.log(red('Unknown subcommand.'));
      logHelpVersion(args);
  }
};
