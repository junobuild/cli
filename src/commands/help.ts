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

Usage: ${green('juno')} ${cyan('upgrade')} ${yellow('[options]')}

Options:
  ${yellow('-s, --src')}             A local wasm file for the upgrade.
  ${yellow('-m, --mission-control')} Target a mission control.
  ${yellow('-o, --orbiter')}         Target an orbiter.
  ${yellow('-r, --reset')}           Reset to the initial state.
  ${yellow('-h, --help')}            Output usage information.
  
Notes:

- The command targets per default a satellite.
- Resetting a mission control is not possible.
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

export const helpDevSubCommands = `${magenta(
  'build'
)}               Compile satellite features using Cargo.
  ${magenta(
    'start'
  )}               Start a local Internet Computer network, encapsulated in a Docker environment.`;

export const helpDev = `
${TITLE}

Usage: ${green('juno')} ${cyan('dev')} ${magenta('<sub-command>')}

Sub-commands:
  ${helpDevSubCommands}
  ${magenta(
    'eject'
  )}               Create a Rust template for custom satellite feature hooks and extensions.
`;
