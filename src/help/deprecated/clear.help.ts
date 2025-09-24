import {cyan, green, magenta, yellow} from 'kleur';
import {HOSTING_CLEAR_DESCRIPTION} from '../../constants/help.constants';
import {helpOutput} from '../common.help';
import {TITLE} from '../help';

const usage = `Alias for: ${green('juno')} ${cyan('hosting')} ${magenta('clear')} ${yellow('[options]')}`;

const doc = `${HOSTING_CLEAR_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${HOSTING_CLEAR_DESCRIPTION}

${usage}
`;

export const logHelpClear = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
