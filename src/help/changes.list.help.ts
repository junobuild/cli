import {cyan, green, magenta, yellow} from 'kleur';
import {CHANGES_LIST_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('changes')} ${magenta('list')} ${yellow('[options]')}

Options:
  ${yellow('-a, --all')}           Search through all changes, not just the 100 most recent.
  ${yellow('-e, --every')}         Include changes of any status (default is only submitted ones).
  ${yellow('-h, --help')}          Output usage information.`;

const doc = `${CHANGES_LIST_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${CHANGES_LIST_DESCRIPTION}

${usage}
`;

export const logHelpChangesList = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
