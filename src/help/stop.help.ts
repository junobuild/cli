import {cyan, green, magenta, yellow} from 'kleur';
import {OPTIONS_HELP, OPTION_HELP, STOP_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('stop')} ${yellow('[options]')}

Options:
  ${yellow('-t, --target')}          Which module type should be stopped? Valid targets are ${magenta('satellite')}, ${magenta('mission-control')} or ${magenta('orbiter')}.  
  ${OPTIONS_HELP}
  ${OPTION_HELP}
  
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
