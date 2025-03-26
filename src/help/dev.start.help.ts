import {cyan, green, magenta, yellow} from 'kleur';
import {DEV_START_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('dev')} ${magenta('start')} ${yellow('[options]')}

Options:
  ${yellow('-r, --reload')}          Start with live reload which rebuild your functions when source files change.
  ${yellow('-h, --help')}            Output usage information.
  
Notes:

- The reload option rebuilds your functions automatically when source files change, with a default debounce delay of 10 seconds; optionally, pass a delay in milliseconds.`;

const doc = `${DEV_START_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${DEV_START_DESCRIPTION}

${usage}
`;

export const logHelpDevStart = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
