import {cyan, grey} from 'kleur';
import {version} from '../../package.json';

const JUNO_LOGO = `  __  __ __  __  _  ____ 
__) ||  |  ||  \\| |/    \\
\\___/ \\___/ |_|\\__|\\____/`;

export const help = `
${JUNO_LOGO} CLI ${grey(`v${version}`)}

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
  ${cyan('version')}             check the version of a satellite
`;
