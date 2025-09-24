import {cyan, green, magenta, yellow} from 'kleur';
import {CONFIG_INIT_DESCRIPTION} from '../../constants/help.constants';
import {helpOutput} from '../common.help';
import {TITLE} from '../help';

const usage = `Alias for: ${green('juno')} ${cyan('config')} ${magenta('init')} ${yellow('[options]')}`;

const doc = `${CONFIG_INIT_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${CONFIG_INIT_DESCRIPTION}

${usage}
`;

export const logHelpInit = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
