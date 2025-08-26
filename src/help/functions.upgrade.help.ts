import {cyan, green, magenta, yellow} from 'kleur';
import {
  FUNCTIONS_UPGRADE_DESCRIPTION,
  OPTION_HELP,
  OPTION_SRC,
  OPTIONS_ENV,
  OPTIONS_UPGRADE
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('functions')} ${magenta('upgrade')} ${yellow('[options]')}

Options:
  ${yellow('--cdn')}                 Select a previously published WASM file from the CDN (interactive).
  ${yellow('--cdn-path')}            Use a specific published WASM file from the CDN.
  ${OPTION_SRC}
  ${OPTIONS_UPGRADE}
  ${OPTIONS_ENV}
  ${OPTION_HELP}
  
Notes:

- If no option is provided, the default local build output will be used.
- If ${yellow('--src')} is specified, it takes precedence over any CDN options.
- Use ${yellow('--cdn')} to interactively select from recent published releases.`;

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
