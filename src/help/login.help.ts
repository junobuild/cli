import {cyan, green, yellow} from 'kleur';
import {helpOutput} from './common.help';
import {TITLE} from './help';

export const LOGIN_DESCRIPTION =
  'Generate an authentication for use in non-interactive environments.';

const usage = `Usage: ${green('juno')} ${cyan('login')} ${yellow('[options]')}

Options:
  ${yellow('-b, --browser')}         A particular browser to open. supported: chrome|firefox|edge.
  ${yellow('-h, --help')}            Output usage information.`;

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
