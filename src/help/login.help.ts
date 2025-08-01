import {cyan, green, yellow} from 'kleur';
import {LOGIN_DESCRIPTION, OPTION_HELP, OPTIONS_CONFIG} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('login')} ${yellow('[options]')}

Options:
  ${yellow('-b, --browser')}         A particular browser to open. supported: chrome|firefox|edge.
  ${yellow('-e, --emulator')}        Skips the Console UI and logs in your terminal with the emulator (⚠️  local development only).
  ${OPTIONS_CONFIG}
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
