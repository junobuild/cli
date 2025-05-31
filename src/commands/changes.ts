import {red} from 'kleur';
import {logHelpChangesApply} from '../help/changes.apply.help';
import {logHelpChanges} from '../help/changes.help';
import {logHelpChangesList} from '../help/changes.list.help';
import {logHelpChangesReject} from '../help/changes.reject.help';
import {applyChanges} from '../services/changes/changes.apply.services';
import {listChanges} from '../services/changes/changes.list.services';
import {rejectChanges} from '../services/changes/changes.reject.services';

export const changes = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'list':
      await listChanges(args);
      break;
    case 'apply':
      await applyChanges(args);
      break;
    case 'reject':
      await rejectChanges(args);
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
    case 'reject':
      logHelpChangesReject(args);
      break;
    default:
      logHelpChanges(args);
  }
};
