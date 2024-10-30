import {logHelpWithMode} from './generic.help';

export const VERSION_DESCRIPTION = 'Check the version of the modules and cli.';

export const logHelpVersion = (args?: string[]) => {
  logHelpWithMode({args, command: 'version', description: VERSION_DESCRIPTION});
};
