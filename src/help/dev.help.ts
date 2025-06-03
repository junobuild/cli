import {cyan, green, magenta, yellow} from 'kleur';
import {DEV_DESCRIPTION, DEV_START_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('dev')} ${magenta('<subcommand>')} ${yellow('[options]')}

Subcommands:
  ${magenta('start')}               ${DEV_START_DESCRIPTION}
  ${magenta('stop')}                Stop the local network.
  ${magenta('build')}               Alias for ${green('juno')} ${cyan('functions')} ${magenta('build')}.
  ${magenta('eject')}               Alias for ${green('juno')} ${cyan('functions')} ${magenta('eject')}.`;

const doc = `${DEV_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${DEV_DESCRIPTION}

${usage}
`;

export const logHelpDev = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
