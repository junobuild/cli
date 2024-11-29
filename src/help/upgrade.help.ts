import {cyan, green, magenta, yellow} from 'kleur';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';

export const UPGRADE_DESCRIPTION = 'Upgrade a module to a new version.';

const usage = `Usage: ${green('juno')} ${cyan('upgrade')} ${yellow('[options]')}

Options:
  ${yellow('-t, --target')}          Which module type should be upgraded? Valid targets are ${magenta('satellite')}, ${magenta('mission-control')} or ${magenta('orbiter')}.  
  ${yellow('-s, --src')}             An optional local gzipped WASM file for the upgrade. By default, the CDN will be used.
  ${yellow('-r, --reset')}           Reset to the initial state.
  ${yellow('-c, --clear-chunks')}    Clear any previously uploaded WASM chunks (applies if the WASM size is greater than 2MB).
  ${helpMode}
  ${yellow('-h, --help')}            Output usage information.
  
Notes:

- Resetting a mission control is not possible.
- Disabling checks bypasses the verification of the target hash and skips the validation for build types.  
- Targets can be shortened to ${magenta('s')} for satellite, ${magenta('m')} for mission-control and ${magenta('o')} for orbiter.`;

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
