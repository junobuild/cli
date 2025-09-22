import {cyan, green, grey} from 'kleur';
import {version} from '../../package.json';
import {
  CLEAR_DESCRIPTION,
  CONFIG_DESCRIPTION,
  DEPLOY_DESCRIPTION,
  EMULATOR_DESCRIPTION,
  FUNCTIONS_DESCRIPTION,
  INIT_DESCRIPTION,
  LOGIN_DESCRIPTION,
  LOGOUT_DESCRIPTION,
  OPEN_DESCRIPTION,
  SNAPSHOT_DESCRIPTION,
  START_DESCRIPTION,
  STATUS_DESCRIPTION,
  STOP_DESCRIPTION,
  UPGRADE_DESCRIPTION,
  USE_DESCRIPTION,
  VERSION_DESCRIPTION,
  WHOAMI_DESCRIPTION
} from '../constants/help.constants';

const JUNO_LOGO = `  __  __ __  __  _  ____ 
__) ||  |  ||  \\| |/    \\
\\___/ \\___/ |_|\\__|\\____/`;

export const TITLE = `${JUNO_LOGO} CLI ${grey(`v${version}`)}`;

export const SMALL_TITLE = `Juno CLI ${grey(`v${version}`)}`;

export const help = `
${TITLE}


Usage: ${green('juno')} ${cyan('<command>')}

Commands:
  ${cyan('clear')}               ${CLEAR_DESCRIPTION}
  ${cyan('config')}              ${CONFIG_DESCRIPTION}
  ${cyan('deploy')}              ${DEPLOY_DESCRIPTION}
  ${cyan('dev')}                 ${EMULATOR_DESCRIPTION}
  ${cyan('functions')}           ${FUNCTIONS_DESCRIPTION}
  ${cyan('init')}                ${INIT_DESCRIPTION}
  ${cyan('help')}                Display help information.
  ${cyan('login')}               ${LOGIN_DESCRIPTION}
  ${cyan('logout')}              ${LOGOUT_DESCRIPTION}
  ${cyan('open')}                ${OPEN_DESCRIPTION}
  ${cyan('snapshot')}            ${SNAPSHOT_DESCRIPTION}
  ${cyan('start')}               ${START_DESCRIPTION}
  ${cyan('stop')}                ${STOP_DESCRIPTION}
  ${cyan('status')}              ${STATUS_DESCRIPTION}
  ${cyan('upgrade')}             ${UPGRADE_DESCRIPTION}
  ${cyan('use')}                 ${USE_DESCRIPTION}
  ${cyan('version')}             ${VERSION_DESCRIPTION}
  ${cyan('whoami')}              ${WHOAMI_DESCRIPTION}
  
Options:
  ${grey('--headless')}          Run the CLI in non-interactive mode (enabled automatically if JUNO_TOKEN is set).
`;
