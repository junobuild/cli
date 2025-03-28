import {cyan, green, yellow} from 'kleur';
import {OPEN_DESCRIPTION} from '../constants/help.constants';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('open')} ${yellow('[options]')}

Options:
  ${yellow('-b, --browser')}         A particular browser to open. supported: chrome|firefox|edge.
  ${yellow('-c, --console')}         Open satellite in the console.
  ${helpMode}
  ${yellow('-h, --help')}            Output usage information.`;

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
