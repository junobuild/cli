import {cyan, green, yellow} from 'kleur';
import {CONFIG_DESCRIPTION, OPTIONS_ENV, OPTION_HELP} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('config')} ${yellow('[options]')}

Options:
  ${yellow('--force')}               Overwrite configuration without checks.
  ${OPTIONS_ENV}
  ${OPTION_HELP}`;

const doc = `${CONFIG_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${CONFIG_DESCRIPTION}

${usage}
`;

export const logHelpConfig = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
