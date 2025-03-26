import {cyan, green, magenta, yellow} from 'kleur';
import {STOP_DESCRIPTION} from '../constants/help.constants';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('stop')} ${yellow('[options]')}

Options:
  ${yellow('-t, --target')}          Which module type should be stopped? Valid targets are ${magenta('satellite')}, ${magenta('mission-control')} or ${magenta('orbiter')}.  
  ${helpMode}
  ${yellow('-h, --help')}            Output usage information.
  
Notes:

- Targets can be shortened to ${magenta('s')} for satellite, ${magenta('m')} for mission-control and ${magenta('o')} for orbiter.`;

const doc = `${STOP_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${STOP_DESCRIPTION}

${usage}
`;

export const logHelpStop = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
