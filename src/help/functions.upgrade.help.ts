import {cyan, green, magenta, yellow} from 'kleur';
import {
  FUNCTIONS_UPGRADE_DESCRIPTION,
  OPTION_HELP,
  OPTION_KEEP_STAGED
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('functions')} ${magenta('upgrade')} ${yellow('[options]')}

Options:
  ${yellow('-n, --no-apply')}        Submit the upgrade as a change but do not apply it yet.
  ${OPTION_KEEP_STAGED}
  ${yellow('-i, --immediate')}       Push the upgrade immediately (bypasses the change workflow).
  ${OPTION_HELP}`;

const doc = `${FUNCTIONS_UPGRADE_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${FUNCTIONS_UPGRADE_DESCRIPTION}

${usage}
`;

export const logHelpFunctionsUpgrade = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
