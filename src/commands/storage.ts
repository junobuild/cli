import {red} from 'kleur';
import {logHelpStorageClear} from '../help/storage.clear.help';
import {logHelpStorageDeploy} from '../help/storage.deploy.help';
import {logHelpStorage} from '../help/storage.help';
import {logHelpStoragePrune} from '../help/storage.prune.help';
import {clearStorage} from '../services/storage/clear.services';
import {deployStorage} from '../services/storage/deploy.services';
import {pruneStorage} from '../services/storage/prune.services';

export const storage = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'deploy':
      await deployStorage(args);
      break;
    case 'clear':
      await clearStorage(args);
      break;
    case 'prune':
      await pruneStorage(args);
      break;
    default:
      console.log(red('Unknown subcommand.'));
      logHelpStorage(args);
  }
};

export const helpStorage = (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'deploy':
      logHelpStorageDeploy(args);
      break;
    case 'clear':
      logHelpStorageClear(args);
      break;
    case 'prune':
      logHelpStoragePrune(args);
      break;
    default:
      logHelpStorage(args);
  }
};
