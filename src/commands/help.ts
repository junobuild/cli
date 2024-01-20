import {cyan, grey} from 'kleur';
import {version} from '../../package.json';

const JUNO_LOGO = `  __  __ __  __  _  ____ 
__) ||  |  ||  \\| |/    \\
\\___/ \\___/ |_|\\__|\\____/`;

const TITLE = `${JUNO_LOGO} CLI ${grey(`v${version}`)}`;

export const help = `
${TITLE}


Usage: ${cyan('juno [command]')}

Commands:
  ${cyan(
    'clear'
  )}               clear existing dapp code by removing JavaScript, HTML, CSS, and other files from your satellite
  ${cyan('config')}              apply configuration to satellite
  ${cyan('deploy')}              deploy your dapp to your satellite
  ${cyan('eject')}               creates a Rust template for custom satellite feature extensions
  ${cyan('init')}                configure the current directory as a satellite
  ${cyan('help')}                display help information
  ${cyan('login')}               generate an authentication for use in non-interactive environments
  ${cyan('logout')}              log out of the current device using the CLI
  ${cyan('open')}                open your satellite in your browser
  ${cyan('upgrade')}             upgrade your satellite to a specific version code
  ${cyan('use')}                 switch between multiple profiles
  ${cyan('version')}             check the version of a satellite, mission control and cli
  ${cyan('whoami')}              display the current controller 
`;

export const helpUpgrade = `
${TITLE}

Usage: ${cyan('juno upgrade [options]')}

Options:
  ${cyan('-s, --src')}             a local wasm file for the upgrade
  ${cyan('-m, --mission-control')} target a mission control
  ${cyan('-o, --orbiter')}         target an orbiter
  ${cyan('-r, --reset')}           reset to the initial state
  ${cyan('-h, --help')}            output usage information
  
Notes:

- The command targets per default a satellite.
- Resetting a mission control is not possible.
`;

export const helpCommand = (command: string) => `
${TITLE}

Usage: ${cyan(`juno ${command}`)}

Options:
  ${cyan('-h, --help')}          output usage information
`;

export const helpLogin = `
${TITLE}

Usage: ${cyan('juno login [options]')}

Options:
  ${cyan('-b, --browser')}         a particular browser to open. supported: chrome|firefox|edge
  ${cyan('-h, --help')}            output usage information
`;

export const helpUse = `
${TITLE}

Usage: ${cyan('juno use [options]')}

Options:
  ${cyan('-p, --profile')}         the profile that should be use
  ${cyan('-l, --list')}            what are the available profiles
  ${cyan('-h, --help')}            output usage information
`;

export const helpOpen = `
${TITLE}

Usage: ${cyan('juno open [options]')}

Options:
  ${cyan('-b, --browser')}         a particular browser to open. supported: chrome|firefox|edge
  ${cyan('-c, --console')}         open satellite in the console
  ${cyan('-h, --help')}            output usage information
`;

export const helpDeploy = `
${TITLE}

Usage: ${cyan('juno deploy [options]')}

Options:
  ${cyan('-c, --clear')}           clear existing dapp files before proceeding with deployment
  ${cyan('-h, --help')}            output usage information
`;

export const helpClear = `
${TITLE}

Usage: ${cyan('juno clear [options]')}

Options:
  ${cyan('-f, --fullPath')}        clear a particular file of your dapp
  ${cyan('-h, --help')}            output usage information
`;
