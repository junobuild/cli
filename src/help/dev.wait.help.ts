import {cyan, green, magenta, yellow} from 'kleur';
import {DEV_WAIT_DESCRIPTION, OPTION_HELP} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('dev')} ${magenta('wait')} ${yellow('[options]')}

Options:
  ${yellow('-t, --timeout')}         Timeout for the emulator to be ready (in ms, default 2min).
  ${OPTION_HELP}`;

const doc = `${DEV_WAIT_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${DEV_WAIT_DESCRIPTION}

${usage}
`;

export const logHelpDevWait = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
