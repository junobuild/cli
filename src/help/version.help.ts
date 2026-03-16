import {cyan, green, magenta, yellow} from 'kleur';
import {OPTION_HELP, VERSION_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('version')} ${magenta('<subcommand>')}

Subcommands:
  ${magenta('check')}                 Configure the weekly version check.

Options:
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
