import {cyan, green, magenta, yellow} from 'kleur';
import {
  CHANGES_APPLY_DESCRIPTION,
  OPTION_HASH,
  OPTION_HELP,
  OPTION_KEEP_STAGED
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('changes')} ${magenta('apply')} ${yellow('[options]')}

Options:
  ${yellow('-i, --id')}              The ID of the change to apply.
  ${OPTION_HASH}
  ${OPTION_KEEP_STAGED}
  ${OPTION_HELP}`;

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
