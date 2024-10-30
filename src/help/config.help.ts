import {cyan, green, yellow} from 'kleur';
import {helpMode, helpOutput, TITLE} from './help';

export const CONFIG_DESCRIPTION = 'Apply configuration to satellite.';

const usage = `Usage: ${green('juno')} ${cyan('config')} ${yellow('[options]')}

Options:
  ${helpMode}
  ${yellow('-h, --help')}            Output usage information.`;

const doc = `${CONFIG_DESCRIPTION}

\`\`\`bash
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
