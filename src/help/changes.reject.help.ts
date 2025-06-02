import {cyan, green, magenta, yellow} from 'kleur';
import {CHANGES_REJECT_DESCRIPTION, OPTION_HASH, OPTION_KEEP_STAGED} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('changes')} ${magenta('reject')} ${yellow('[options]')}

Options:
  ${yellow('-i, --id')}              The ID of the change to reject.
  ${OPTION_HASH}
  ${OPTION_KEEP_STAGED}
  ${yellow('-h, --help')}            Output usage information.`;

const doc = `${CHANGES_REJECT_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${CHANGES_REJECT_DESCRIPTION}

${usage}
`;

export const logHelpChangesReject = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
