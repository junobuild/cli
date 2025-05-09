import {cyan, green, yellow} from 'kleur';
import {INIT_DESCRIPTION} from '../constants/help.constants';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('init')} ${yellow('[options]')}

Options:
  ${yellow('-m, --minimal')}         Skip few prompts and generate a config file with a placeholder satellite ID.
  ${helpMode}
  ${yellow('-h, --help')}            Output usage information.`;

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
