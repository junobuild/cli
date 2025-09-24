import {cyan, green, magenta, yellow} from 'kleur';
import {
  CONFIG_APPLY_DESCRIPTION,
  CONFIG_DESCRIPTION,
  CONFIG_INIT_DESCRIPTION
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('config')} ${magenta('<subcommand>')} ${yellow('[options]')}

Subcommands:
  ${magenta('apply')}               ${CONFIG_APPLY_DESCRIPTION}
  ${magenta('init')}                ${CONFIG_INIT_DESCRIPTION}`;

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
