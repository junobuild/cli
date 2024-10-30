import {hasArgs} from '@junobuild/cli-tools';
import {cyan, green, grey, yellow} from 'kleur';
import {version} from '../../package.json';
import {CLEAR_DESCRIPTION} from './clear.help';
import {CONFIG_DESCRIPTION} from './config.help';
import {DEPLOY_DESCRIPTION} from './deploy.help';
import {DEV_DESCRIPTION} from './dev.help';
import {LOGIN_DESCRIPTION} from './login.help';
import {OPEN_DESCRIPTION} from './open.help';
import {UPGRADE_DESCRIPTION} from './upgrade.help';
import {USE_DESCRIPTION} from './use.help';

const JUNO_LOGO = `  __  __ __  __  _  ____ 
__) ||  |  ||  \\| |/    \\
\\___/ \\___/ |_|\\__|\\____/`;

export const TITLE = `${JUNO_LOGO} CLI ${grey(`v${version}`)}`;

export const help = `
${TITLE}


Usage: ${green('juno')} ${cyan('<command>')}

Commands:
  ${cyan('clear')}               ${CLEAR_DESCRIPTION}
  ${cyan('config')}              ${CONFIG_DESCRIPTION}
  ${cyan('deploy')}              ${DEPLOY_DESCRIPTION}
  ${cyan('dev')}                 ${DEV_DESCRIPTION}
  ${cyan('init')}                Configure the current directory as a satellite.
  ${cyan('help')}                Display help information.
  ${cyan('login')}               ${LOGIN_DESCRIPTION}
  ${cyan('logout')}              Log out of the current device using the CLI.
  ${cyan('open')}                ${OPEN_DESCRIPTION}
  ${cyan('upgrade')}             ${UPGRADE_DESCRIPTION}
  ${cyan('use')}                 ${USE_DESCRIPTION}
  ${cyan('version')}             Check the version of a satellite, mission control and cli.
  ${cyan('whoami')}              Display the current controller.
  
Options:
  ${grey('--headless')}          Run the CLI in non-interactive mode (enabled automatically if JUNO_TOKEN is set).
`;

export const helpMode = `${yellow('-m, --mode')}            Set env mode. For example production or a custom string. Default is production.`;

export const helpOutput = (args?: string[]): 'doc' | 'cli' =>
  hasArgs({args, options: ['-d', '--doc']}) ? 'doc' : 'cli';
