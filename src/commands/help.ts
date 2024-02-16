import {cyan, green, grey, magenta, yellow} from 'kleur';
import {version} from '../../package.json';

const JUNO_LOGO = `  __  __ __  __  _  ____ 
__) ||  |  ||  \\| |/    \\
\\___/ \\___/ |_|\\__|\\____/`;

const TITLE = `${JUNO_LOGO} CLI ${grey(`v${version}`)}`;

export const help = `
${TITLE}


Usage: ${green('juno')} ${cyan('<command>')}

Commands:
  ${cyan(
    'clear'
  )}               Clear existing dapp code by removing JavaScript, HTML, CSS, and other files from your satellite.
  ${cyan('config')}              Apply configuration to satellite.
  ${cyan('deploy')}              Deploy your dapp to your satellite.
  ${cyan(
    'dev'
  )}                 Handle development-related tasks such as building and deploying locally using Cargo and Docker.
  ${cyan('init')}                Configure the current directory as a satellite.
  ${cyan('help')}                Display help information.
  ${cyan('login')}               Generate an authentication for use in non-interactive environments.
  ${cyan('logout')}              Log out of the current device using the CLI.
  ${cyan('open')}                Open your satellite in your browser.
  ${cyan('upgrade')}             Upgrade your satellite to a specific version code.
  ${cyan('use')}                 Switch between multiple profiles.
  ${cyan('version')}             Check the version of a satellite, mission control and cli.
  ${cyan('whoami')}              Display the current controller.
`;

export const helpUpgrade = `
${TITLE}

Usage: ${green('juno')} ${cyan('upgrade')} ${magenta('<subcommand>')} ${yellow('[options]')}

Subcommands:
  ${magenta('satellite')}             Upgrade a satellite. Subcommand can be shortened to ${magenta('s')}.
  ${magenta('mission-control')}       Upgrade a mission control. Subcommand can be shortened to ${magenta('m')}.
  ${magenta('orbiter')}               Upgrade an orbiter. Subcommand can be shortened as ${magenta('o')}.

Options:
  ${yellow('-s, --src')}             A local gzipped wasm file for the upgrade.
  ${yellow('-r, --reset')}           Reset to the initial state.
  ${yellow('-n, --nocheck')}         Skip assertions and execute upgrade without prompts.
  ${yellow('-h, --help')}            Output usage information.
  
Notes:

- Resetting a mission control is not possible.
- Disabling checks bypasses the verification of the target hash and skips the validation for build types.  
`;

export const helpCommand = (command: string) => `
${TITLE}

Usage: ${green('juno')} ${cyan(command)} ${yellow('[options]')}

Options:
  ${yellow('-h, --help')}          Output usage information.
`;

export const helpLogin = `
${TITLE}

Usage: ${green('juno')} ${cyan('login')} ${yellow('[options]')}

Options:
  ${yellow('-b, --browser')}         A particular browser to open. supported: chrome|firefox|edge.
  ${yellow('-h, --help')}            Output usage information.
`;

export const helpUse = `
${TITLE}

Usage: ${green('juno')} ${cyan('use')} ${yellow('[options]')}

Options:
  ${yellow('-p, --profile')}         The profile that should be use.
  ${yellow('-l, --list')}            What are the available profiles.
  ${yellow('-h, --help')}            Output usage information.
`;

export const helpOpen = `
${TITLE}

Usage: ${green('juno')} ${cyan('open')} ${yellow('[options]')}

Options:
  ${yellow('-b, --browser')}         A particular browser to open. supported: chrome|firefox|edge.
  ${yellow('-c, --console')}         Open satellite in the console.
  ${yellow('-h, --help')}            Output usage information.
`;

export const helpDeploy = `
${TITLE}

Usage: ${green('juno')} ${cyan('deploy')} ${yellow('[options]')}

Options:
  ${yellow('-c, --clear')}           Clear existing dapp files before proceeding with deployment.
  ${yellow('-h, --help')}            Output usage information.
`;

export const helpClear = `
${TITLE}

Usage: ${green('juno')} ${cyan('clear')} ${yellow('[options]')}

Options:
  ${yellow('-f, --fullPath')}        Clear a particular file of your dapp.
  ${yellow('-h, --help')}            Output usage information.
`;

const helpDevBuild = `${magenta('build')}               Compile satellite features using Cargo.`;
const helpDevStart = `${magenta(
  'start'
)}               Start a local Internet Computer network, encapsulated in a Docker environment.`;

export const helpDevContinue = `${helpDevBuild}
  ${helpDevStart}`;

export const helpDev = `
${TITLE}

Usage: ${green('juno')} ${cyan('dev')} ${magenta('<subcommand>')}

Subcommands:
  ${helpDevBuild}
  ${magenta(
    'eject'
  )}               Create a Rust template for custom satellite feature hooks and extensions.
  ${helpDevStart}
  ${magenta('stop')}                Stop the Docker environment.
`;
