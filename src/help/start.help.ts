import {cyan, green, magenta, yellow} from 'kleur';
import {START_DESCRIPTION} from '../constants/help.constants';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('start')} ${yellow('[options]')}

Options:
  ${yellow('-t, --target')}          Which module type should be started? Valid targets are ${magenta('satellite')}, ${magenta('mission-control')} or ${magenta('orbiter')}.  
  ${helpMode}
  ${yellow('-h, --help')}            Output usage information.
  
Notes:

- Targets can be shortened to ${magenta('s')} for satellite, ${magenta('m')} for mission-control and ${magenta('o')} for orbiter.`;

const doc = `${START_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${START_DESCRIPTION}

${usage}
`;

export const logHelpStart = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
