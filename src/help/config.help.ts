import {cyan, green, yellow} from 'kleur';
import {CONFIG_DESCRIPTION, OPTION_HELP} from '../constants/help.constants';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('config')} ${yellow('[options]')}

Options:
  ${helpMode}
  ${OPTION_HELP}`;

const doc = `${CONFIG_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${CONFIG_DESCRIPTION}

${usage}
`;

export const logHelpConfig = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
