import {cyan, green, yellow} from 'kleur';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';
import {OPEN_DESCRIPTION} from './open.help';

export const INIT_DESCRIPTION = 'Set up your project.';

const usage = `Usage: ${green('juno')} ${cyan('init')} ${yellow('[options]')}

Options:
  ${yellow('-m, --minimal')}         Skip few prompts and generate a config file with a placeholder satellite ID.
  ${helpMode}
  ${yellow('-h, --help')}            Output usage information.`;

const doc = `${OPEN_DESCRIPTION}

\`\`\`bash
${usage}
\`\`\`
`;

const help = `${TITLE}

${OPEN_DESCRIPTION}

${usage}
`;

export const logHelpInit = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
