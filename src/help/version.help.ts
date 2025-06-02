import {cyan, green, yellow} from 'kleur';
import {OPTION_HELP, VERSION_DESCRIPTION} from '../constants/help.constants';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('init')} ${yellow('[options]')}

Options:
  ${yellow('-c, --cli')}             Check only the version of the CLI.
  ${helpMode}
  ${OPTION_HELP}`;

const doc = `${VERSION_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${VERSION_DESCRIPTION}

${usage}
`;

export const logHelpVersion = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
