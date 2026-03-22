import {cyan, green, magenta, yellow} from 'kleur';
import {STORAGE_PRUNE_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('storage')} ${magenta('prune')} ${yellow('[options]')}

Options:
  ${yellow('-m, --mode')}            Choose which environment to use (production, staging, development).
  ${yellow('-h, --help')}            Output usage information.`;

const doc = `${STORAGE_PRUNE_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${STORAGE_PRUNE_DESCRIPTION}

${usage}
`;

export const logHelpStoragePrune = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
