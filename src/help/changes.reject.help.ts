import {cyan, green, magenta, yellow} from 'kleur';
import {CHANGES_REJECT_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('changes')} ${magenta('reject')} ${yellow('[options]')}

Options:
  ${yellow('-i, --id')}            The ID of the change to reject.
  ${yellow('-s, --hash')}          The expected hash of all included changes (for verification).
  ${yellow('-k, --keep-staged')}   Keep staged assets in memory after applying the change.
  ${yellow('-h, --help')}          Output usage information.`;

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
