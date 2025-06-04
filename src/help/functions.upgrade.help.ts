import {cyan, green, magenta, yellow} from 'kleur';
import {
  FUNCTIONS_UPGRADE_DESCRIPTION,
  OPTION_HELP,
  OPTION_SRC,
  OPTIONS_UPGRADE
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('functions')} ${magenta('upgrade')} ${yellow('[options]')}

Options:
  ${OPTION_SRC}
  ${OPTIONS_UPGRADE}
  ${OPTION_HELP}`;

const doc = `${FUNCTIONS_UPGRADE_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${FUNCTIONS_UPGRADE_DESCRIPTION}

${usage}
`;

export const logHelpFunctionsUpgrade = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
