import {cyan, green, magenta, yellow} from 'kleur';
import {CONFIG_INIT_DESCRIPTION, OPTION_HELP, OPTIONS_ENV} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('config')} ${magenta('init')} ${yellow('[options]')}

Options:
  ${yellow('--minimal')}             Skip few prompts and generate a config file with a placeholder satellite ID.
  ${OPTIONS_ENV}
  ${OPTION_HELP}`;

const doc = `${CONFIG_INIT_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${CONFIG_INIT_DESCRIPTION}

${usage}
`;

export const logHelpConfigInit = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
