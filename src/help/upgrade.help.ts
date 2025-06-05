import {cyan, green, yellow} from 'kleur';
import {
  OPTION_HELP,
  OPTION_SRC,
  OPTIONS_HELP,
  OPTIONS_UPGRADE,
  UPGRADE_DESCRIPTION
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';
import {TARGET_OPTION_NOTE, targetOption} from './target.help';

const usage = `Usage: ${green('juno')} ${cyan('upgrade')} ${yellow('[options]')}

Options:
  ${targetOption('upgrade')}  
  ${OPTION_SRC}
  ${OPTIONS_UPGRADE}
  ${OPTIONS_HELP}
  ${OPTION_HELP}
  
Notes:

- Resetting a mission control is not possible.
${TARGET_OPTION_NOTE}`;

const doc = `${UPGRADE_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${UPGRADE_DESCRIPTION}

${usage}
`;

export const logHelpUpgrade = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
