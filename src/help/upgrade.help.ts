import {cyan, green, yellow} from 'kleur';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';
import {TARGET_OPTION_NOTE, targetOption} from './target.help';

export const UPGRADE_DESCRIPTION = 'Upgrade a module to a new version.';

const usage = `Usage: ${green('juno')} ${cyan('upgrade')} ${yellow('[options]')}

Options:
  ${targetOption('upgrade')}  
  ${yellow('-s, --src')}             An optional local gzipped WASM file for the upgrade. By default, the CDN will be used.
  ${yellow('-r, --reset')}           Reset to the initial state.
  ${yellow('-cc, --clear-chunks')}   Clear any previously uploaded WASM chunks (applies if the WASM size is greater than 2MB).
  ${yellow('-ns, --no-snapshot')}    Skip creating a snapshot before upgrading.
  ${helpMode}
  ${yellow('-h, --help')}            Output usage information.
  
Notes:

- Resetting a mission control is not possible.
${TARGET_OPTION_NOTE}`;

const doc = `${UPGRADE_DESCRIPTION}

\`\`\`bash
${usage}
\`\`\`
`;

const help = `${TITLE}

${UPGRADE_DESCRIPTION}

${usage}
`;

export const logHelpUpgrade = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
