import {cyan, green, yellow} from 'kleur';
import {INIT_DESCRIPTION, OPTION_HELP, OPTIONS_HELP} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('init')} ${yellow('[options]')}

Options:
  ${yellow('--minimal')}         Skip few prompts and generate a config file with a placeholder satellite ID.
  ${OPTIONS_HELP}
  ${OPTION_HELP}`;

const doc = `${INIT_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${INIT_DESCRIPTION}

${usage}
`;

export const logHelpInit = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
