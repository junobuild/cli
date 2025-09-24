import {cyan, green, magenta, yellow} from 'kleur';
import {HOSTING_DEPLOY_DESCRIPTION} from '../../constants/help.constants';
import {helpOutput} from '../common.help';
import {TITLE} from '../help';

const usage = `Alias for: ${green('juno')} ${cyan('hosting')} ${magenta('deploy')} ${yellow('[options]')}`;

const doc = `${HOSTING_DEPLOY_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${HOSTING_DEPLOY_DESCRIPTION}

${usage}
`;

export const logHelpDeploy = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
