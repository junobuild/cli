import {cyan, green, magenta, yellow} from 'kleur';
import {EMULATOR_DESCRIPTION} from '../../constants/help.constants';
import {helpOutput} from '../common.help';
import {TITLE} from '../help';

const usage = `Usage: ${green('juno')} ${cyan('dev')} ${magenta('<subcommand>')} ${yellow('[options]')}

Subcommands:
  ${magenta('start')}               Alias for ${green('juno')} ${cyan('emulator')} ${magenta('start')}.
  ${magenta('stop')}                Alias for ${green('juno')} ${cyan('emulator')} ${magenta('stop')}.
  ${magenta('wait')}                Alias for ${green('juno')} ${cyan('emulator')} ${magenta('wait')}.
  ${magenta('build')}               Alias for ${green('juno')} ${cyan('functions')} ${magenta('build')}.
  ${magenta('eject')}               Alias for ${green('juno')} ${cyan('functions')} ${magenta('eject')}.`;

const doc = `${EMULATOR_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${EMULATOR_DESCRIPTION}

${usage}
`;

export const logHelpDev = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
