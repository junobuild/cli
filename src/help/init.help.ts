import {logHelp} from './generic.help';

export const INIT_DESCRIPTION = 'Set up the project as a Satellite.';

export const logHelpInit = (args?: string[]) => {
  logHelp({args, command: 'init', description: INIT_DESCRIPTION});
};
