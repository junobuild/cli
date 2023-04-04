import {cyan, grey} from 'kleur';
import {version} from '../../package.json';

const JUNO_LOGO = `  __  __ __  __  _  ____ 
__) ||  |  ||  \\| |/    \\
\\___/ \\___/ |_|\\__|\\____/`;

const title = `${JUNO_LOGO} CLI ${grey(`v${version}`)}`;

export const help = `
${title}

Usage: ${cyan('juno [command]')}

Commands:
  ${cyan('clear')}               clear existing app code and assets from your satellite
  ${cyan('config')}              apply configuration to satellite
  ${cyan('deploy')}              deploy your app to your satellite
  ${cyan('init')}                configure the current directory as a satellite
  ${cyan('help')}                display help information
  ${cyan('login')}               generate an authentication for use in non-interactive environments
  ${cyan('logout')}              log out of the current device using the CLI
  ${cyan('upgrade')}             upgrade your satellite to a specific version code
  ${cyan('use')}                 switch between multiple profiles
  ${cyan('version')}             check the version of a satellite, mission control and cli
  ${cyan('whoami')}              display the current controller 
`;

export const helpUpgrade = `
${title}

Usage: ${cyan('juno upgrade [options]')}

Options:
  ${cyan('-s, --src')}             a local wasm file for the upgrade
  ${cyan('-m, --mission-control')} target a mission control instead of satellite (default)
  ${cyan('-h, --help')}            output usage information
`;

export const helpCommand = (command: string) => `
${title}

Usage: ${cyan(`juno ${command}`)}

Options:
  ${cyan('-h, --help')}          output usage information
`;

export const helpLogin = `
${title}

Usage: ${cyan('juno login [options]')}

Options:
  ${cyan('-b, --browser')}         a particular browser to open. supported: chrome|firefox|edge
  ${cyan('-h, --help')}            output usage information
`;

export const helpUse = `
${title}

Usage: ${cyan('juno use [options]')}

Options:
  ${cyan('-p, --profile')}         the profile that should be use
  ${cyan('-l, --list')}            what are the available profiles
  ${cyan('-h, --help')}            output usage information
`;
