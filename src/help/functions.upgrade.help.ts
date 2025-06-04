import {cyan, green, magenta, yellow} from 'kleur';
import {
  FUNCTIONS_UPGRADE_DESCRIPTION,
  OPTION_HELP,
  OPTION_SRC,
  OPTIONS_UPGRADE
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('functions')} ${magenta('upgrade')} ${yellow('[options]')}

Options:
  ${yellow('-c, --cdn [path]')}      Upgrade from a previously published CDN WASM file.
  ${OPTION_SRC}
  ${OPTIONS_UPGRADE}
  ${OPTION_HELP}
  
Notes:

- If no option is provided, the default local build output will be used.
- If both ${yellow('--src')} and ${yellow('--cdn')} are specified, ${yellow('--src')} takes precedence.
- If ${yellow('--cdn')} is used without a path, an interactive menu will let you choose from recent releases.`;

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
