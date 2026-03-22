import {cyan, green, magenta, yellow} from 'kleur';
import {
  STORAGE_CLEAR_DESCRIPTION,
  STORAGE_DEPLOY_DESCRIPTION,
  STORAGE_DESCRIPTION,
  STORAGE_PRUNE_DESCRIPTION
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('storage')} ${magenta('<subcommand>')} ${yellow('[options]')}

Subcommands:
  ${magenta('clear')}               ${STORAGE_CLEAR_DESCRIPTION}
  ${magenta('deploy')}              ${STORAGE_DEPLOY_DESCRIPTION}
  ${magenta('prune')}               ${STORAGE_PRUNE_DESCRIPTION}`;

const doc = `${STORAGE_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${STORAGE_DESCRIPTION}

${usage}
`;

export const logHelpStorage = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
