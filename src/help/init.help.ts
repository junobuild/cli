import {logHelp} from './generic.help';

export const INIT_DESCRIPTION = 'Set up your project.';

export const logHelpInit = (args?: string[]) => {
  logHelp({args, command: 'init', description: INIT_DESCRIPTION});
};
