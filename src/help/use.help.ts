import {cyan, green, yellow} from 'kleur';
import {helpOutput} from './common.help';
import {TITLE} from './help';

export const USE_DESCRIPTION = 'Switch between multiple profiles.';

const usage = `Usage: ${green('juno')} ${cyan('use')} ${yellow('[options]')}

Options:
  ${yellow('-p, --profile')}         The profile that should be use.
  ${yellow('-l, --list')}            What are the available profiles.
  ${yellow('-h, --help')}            Output usage information.`;

const doc = `${USE_DESCRIPTION}

\`\`\`bash
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
