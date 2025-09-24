import {cyan, green, magenta, yellow} from 'kleur';
import {HOSTING_CLEAR_DESCRIPTION, OPTIONS_ENV, OPTION_HELP} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('hosting')} ${magenta('clear')} ${yellow('[options]')}

Options:
  ${yellow('-f, --fullPath')}        Clear a particular file of your app.
  ${OPTIONS_ENV}
  ${OPTION_HELP}`;

const doc = `${HOSTING_CLEAR_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${HOSTING_CLEAR_DESCRIPTION}

${usage}
`;

export const logHelpEmulatorClear = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
