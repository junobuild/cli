import {cyan, green, yellow} from 'kleur';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';

export const CLEAR_DESCRIPTION =
  'Clear existing dapp code by removing JavaScript, HTML, CSS, and other files from your satellite.';

const usage = `Usage: ${green('juno')} ${cyan('clear')} ${yellow('[options]')}

Options:
  ${yellow('-f, --fullPath')}        Clear a particular file of your dapp.
  ${helpMode}
  ${yellow('-h, --help')}            Output usage information.`;

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
