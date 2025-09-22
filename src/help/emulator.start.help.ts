import {cyan, green, magenta, yellow} from 'kleur';
import {
  EMULATOR_START_DESCRIPTION,
  FUNCTIONS_BUILD_NOTES,
  OPTION_HELP,
  OPTIONS_BUILD
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('emulator')} ${magenta('start')} ${yellow('[options]')}

Options:
  ${OPTIONS_BUILD}
  ${yellow('-w, --watch')}           Rebuild your functions automatically when source files change.
  ${OPTION_HELP}
  
Notes:

- The language and path options are only used in combination with watch.
${FUNCTIONS_BUILD_NOTES}`;

const doc = `${EMULATOR_START_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${EMULATOR_START_DESCRIPTION}

${usage}
`;

export const logHelpEmulatorStart = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
