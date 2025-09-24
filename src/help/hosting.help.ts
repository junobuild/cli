import {cyan, green, magenta, yellow} from 'kleur';
import {
  HOSTING_CLEAR_DESCRIPTION,
  HOSTING_DEPLOY_DESCRIPTION,
  HOSTING_DESCRIPTION
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('hosting')} ${magenta('<subcommand>')} ${yellow('[options]')}

Subcommands:
  ${magenta('deploy')}              ${HOSTING_DEPLOY_DESCRIPTION}
  ${magenta('clear')}               ${HOSTING_CLEAR_DESCRIPTION}`;

const doc = `${HOSTING_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${HOSTING_DESCRIPTION}

${usage}
`;

export const logHelpHosting = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
