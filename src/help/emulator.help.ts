import {cyan, green, magenta, yellow} from 'kleur';
import {
  EMULATOR_DESCRIPTION,
  EMULATOR_START_DESCRIPTION,
  EMULATOR_WAIT_DESCRIPTION
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('emulator')} ${magenta('<subcommand>')} ${yellow('[options]')}

Subcommands:
  ${magenta('start')}               ${EMULATOR_START_DESCRIPTION}
  ${magenta('stop')}                Stop the local network.
  ${magenta('wait')}                ${EMULATOR_WAIT_DESCRIPTION}`;

const doc = `${EMULATOR_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${EMULATOR_DESCRIPTION}

${usage}
`;

export const logHelpEmulator = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
