import {cyan, green, yellow} from 'kleur';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';

export const OPEN_DESCRIPTION = 'Open your satellite in your browser.';

const usage = `Usage: ${green('juno')} ${cyan('open')} ${yellow('[options]')}

Options:
  ${yellow('-b, --browser')}         A particular browser to open. supported: chrome|firefox|edge.
  ${yellow('-c, --console')}         Open satellite in the console.
  ${helpMode}
  ${yellow('-h, --help')}            Output usage information.`;

const doc = `${OPEN_DESCRIPTION}

\`\`\`bash
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
