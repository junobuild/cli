import {logHelpWithMode} from './generic.help';

export const WHOAMI_DESCRIPTION =
  'Display your current profile, controller, and links to your satellite.';

export const logHelpWhoAmI = (args?: string[]) => {
  logHelpWithMode({args, command: 'whoami', description: WHOAMI_DESCRIPTION});
};
