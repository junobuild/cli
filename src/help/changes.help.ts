import {cyan, green, magenta, yellow} from 'kleur';
import {
  CHANGES_APPLY_DESCRIPTION,
  CHANGES_DESCRIPTION,
  CHANGES_LIST_DESCRIPTION,
  CHANGES_REJECT_DESCRIPTION
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const helpChangesList = `${magenta('list')}                ${CHANGES_LIST_DESCRIPTION}`;
const helpChangesApply = `${magenta('apply')}               ${CHANGES_APPLY_DESCRIPTION}`;
const helpChangesReject = `${magenta('reject')}              ${CHANGES_REJECT_DESCRIPTION}`;

const usage = `Usage: ${green('juno')} ${cyan('changes')} ${magenta('<subcommand>')} ${yellow('[options]')}

Subcommands:
  ${helpChangesApply}
  ${helpChangesList}
  ${helpChangesReject}`;

const doc = `${CHANGES_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${CHANGES_DESCRIPTION}

${usage}
`;

export const logHelpChanges = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
