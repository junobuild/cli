import {cyan, green, magenta, yellow} from 'kleur';
import {helpMode, helpOutput, TITLE} from './help';

export const UPGRADE_DESCRIPTION = 'Upgrade your satellite to a specific version code.';

const usage = `Usage: ${green('juno')} ${cyan('upgrade')} ${yellow('[options]')}

Options:
  ${yellow('-t, --target')}          What type of segment should be upgraded. Valid targets are ${magenta('satellite')}, ${magenta('mission-control')} or ${magenta('orbiter')}.  
  ${yellow('-s, --src')}             A local gzipped wasm file for the upgrade.
  ${yellow('-r, --reset')}           Reset to the initial state.
  ${yellow('-n, --nocheck')}         Skip assertions and execute upgrade without prompts.
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

${usage}
`;

export const logHelpUpgrade = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
