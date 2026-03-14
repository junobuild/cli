import {cyan, green, magenta, yellow} from 'kleur';
import {
  HOSTING_PRUNE_DESCRIPTION,
  OPTION_HELP,
  OPTIONS_ENV
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('hosting')} ${magenta('prune')} ${yellow('[options]')}

Options:
  ${yellow('--dry-run')}             List stale files that would be deleted without actually deleting them.
  ${OPTIONS_ENV}
  ${OPTION_HELP}`;

const doc = `${HOSTING_PRUNE_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${HOSTING_PRUNE_DESCRIPTION}

${usage}
`;

export const logHelpHostingPrune = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
