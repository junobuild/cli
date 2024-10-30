import {logHelp} from './generic.help';

export const LOGOUT_DESCRIPTION =
  'Log out of the current device. ⚠️ This action does not remove controllers from the module.';

export const logHelpLogout = (args?: string[]) => {
  logHelp({args, command: 'logout', description: LOGOUT_DESCRIPTION});
};
