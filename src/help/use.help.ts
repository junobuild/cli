import {cyan, green, yellow} from 'kleur';
import {OPTION_HELP, USE_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('use')} ${yellow('[options]')}

Options:
  ${yellow('-p, --profile')}         The profile that should be use.
  ${yellow('-l, --list')}            What are the available profiles.
  ${OPTION_HELP}`;

const doc = `${USE_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${USE_DESCRIPTION}

${usage}
`;

export const logHelpUse = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
