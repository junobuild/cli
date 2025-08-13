import {cyan, green, yellow} from 'kleur';
import {OPTIONS_ENV, OPTION_HELP, STATUS_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('status')} ${yellow('[options]')}

Options:
  ${OPTIONS_ENV}
  ${OPTION_HELP}`;

const doc = `${STATUS_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${STATUS_DESCRIPTION}

${usage}
`;

export const logHelpStatus = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
