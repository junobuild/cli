import {cyan, green, magenta, yellow} from 'kleur';
import {STORAGE_CLEAR_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('storage')} ${magenta('clear')} ${yellow('[options]')}

Options:
  ${yellow('-c, --collection')}     Specify the collection to clear a specific file from.
  ${yellow('-f, --fullPath')}       Specify the full path of a specific file to clear.
  ${yellow('-m, --mode')}            Choose which environment to use (production, staging, development).
  ${yellow('-h, --help')}            Output usage information.`;

const doc = `${STORAGE_CLEAR_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${STORAGE_CLEAR_DESCRIPTION}

${usage}
`;

export const logHelpStorageClear = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
