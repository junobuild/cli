import {cyan, green, magenta, yellow} from 'kleur';
import {CHANGES_APPLY_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('changes')} ${magenta('apply')} ${yellow('[options]')}

Options:
  ${yellow('-i, --id')}            The ID of the change to apply.
  ${yellow('-s, --hash')}          The expected hash of all included changes (for verification).
  ${yellow('-h, --help')}          Output usage information.`;

const doc = `${CHANGES_APPLY_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${CHANGES_APPLY_DESCRIPTION}

${usage}
`;

export const logHelpChangesApply = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
