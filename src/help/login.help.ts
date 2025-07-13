import {cyan, green, yellow} from 'kleur';
import {LOGIN_DESCRIPTION, OPTION_HELP, OPTION_MODE} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('login')} ${yellow('[options]')}

Options:
  ${yellow('-b, --browser')}         A particular browser to open. supported: chrome|firefox|edge.
  ${OPTION_MODE}
  ${OPTION_HELP}`;

const doc = `${LOGIN_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${LOGIN_DESCRIPTION}

${usage}
`;

export const logHelpLogin = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
