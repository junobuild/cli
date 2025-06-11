import {cyan, green, yellow} from 'kleur';
import {OPEN_DESCRIPTION, OPTION_HELP, OPTIONS_URL} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('open')} ${yellow('[options]')}

Options:
  ${yellow('-b, --browser')}         A particular browser to open. supported: chrome|firefox|edge.
  ${yellow('-c, --console')}         Open satellite in the console.
  ${OPTIONS_URL}
  ${OPTION_HELP}`;

const doc = `${OPEN_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${OPEN_DESCRIPTION}

${usage}
`;

export const logHelpOpen = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
