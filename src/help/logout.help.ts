import {LOGOUT_DESCRIPTION} from '../constants/help.constants';
import {logHelp} from './generic.help';

export const logHelpLogout = (args?: string[]) => {
  logHelp({args, command: 'logout', description: LOGOUT_DESCRIPTION});
};
