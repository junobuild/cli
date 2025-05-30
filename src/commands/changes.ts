import {red} from 'kleur';
import {logHelpChangesApply} from '../help/changes.apply.help';
import {logHelpChanges} from '../help/changes.help';
import {logHelpChangesList} from '../help/changes.list.help';
import {listChanges} from '../services/changes/changes.list.services';
import {applyChanges} from '../services/changes/changes.apply.services';

export const changes = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'list':
      await listChanges(args);
      break;
    case 'apply':
      await applyChanges(args);
      break;
    default:
      console.log(red('Unknown subcommand.'));
      logHelpChanges();
  }
};

export const helpChanges = (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'list':
      logHelpChangesList(args);
      break;
    case 'apply':
      logHelpChangesApply(args);
      break;
    default:
      logHelpChanges(args);
  }
};
