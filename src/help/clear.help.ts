import {cyan, green, yellow} from 'kleur';
import {CLEAR_DESCRIPTION, OPTIONS_HELP, OPTION_HELP} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('clear')} ${yellow('[options]')}

Options:
  ${yellow('-f, --fullPath')}        Clear a particular file of your app.
  ${OPTIONS_HELP}
  ${OPTION_HELP}`;

const doc = `${CLEAR_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${CLEAR_DESCRIPTION}

${usage}
`;

export const logHelpClear = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
