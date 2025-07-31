import {cyan, green, magenta, yellow} from 'kleur';
import {OPTIONS_ENV, OPTION_HELP, START_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('start')} ${yellow('[options]')}

Options:
  ${yellow('-t, --target')}          Which module type should be started? Valid targets are ${magenta('satellite')}, ${magenta('mission-control')} or ${magenta('orbiter')}.  
  ${OPTIONS_ENV}
  ${OPTION_HELP}
  
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
