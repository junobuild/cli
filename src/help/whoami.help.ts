import {WHOAMI_DESCRIPTION} from '../constants/help.constants';
import {logHelpWithMode} from './generic.help';

export const logHelpWhoAmI = (args?: string[]) => {
  logHelpWithMode({args, command: 'whoami', description: WHOAMI_DESCRIPTION});
};
