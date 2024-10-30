import {cyan, green, grey} from 'kleur';
import {version} from '../../package.json';
import {CLEAR_DESCRIPTION} from './clear.help';
import {CONFIG_DESCRIPTION} from './config.help';
import {DEPLOY_DESCRIPTION} from './deploy.help';
import {DEV_DESCRIPTION} from './dev.help';
import {INIT_DESCRIPTION} from './init.help';
import {LOGIN_DESCRIPTION} from './login.help';
import {LOGOUT_DESCRIPTION} from './logout.help';
import {OPEN_DESCRIPTION} from './open.help';
import {UPGRADE_DESCRIPTION} from './upgrade.help';
import {USE_DESCRIPTION} from './use.help';
import {VERSION_DESCRIPTION} from './version.help';
import {WHOAMI_DESCRIPTION} from './whoami.help';

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
  ${cyan('init')}                ${INIT_DESCRIPTION}
  ${cyan('help')}                Display help information.
  ${cyan('login')}               ${LOGIN_DESCRIPTION}
  ${cyan('logout')}              ${LOGOUT_DESCRIPTION}
  ${cyan('open')}                ${OPEN_DESCRIPTION}
  ${cyan('upgrade')}             ${UPGRADE_DESCRIPTION}
  ${cyan('use')}                 ${USE_DESCRIPTION}
  ${cyan('version')}             ${VERSION_DESCRIPTION}
  ${cyan('whoami')}              ${WHOAMI_DESCRIPTION}
  
Options:
  ${grey('--headless')}          Run the CLI in non-interactive mode (enabled automatically if JUNO_TOKEN is set).
`;
