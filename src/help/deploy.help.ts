import {cyan, green, yellow} from 'kleur';
import {
  DEPLOY_DESCRIPTION,
  NOTE_KEEP_STAGED,
  OPTION_HELP,
  OPTION_KEEP_STAGED,
  OPTIONS_HELP
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('deploy')} ${yellow('[options]')}

Options:
  ${yellow('-c, --clear')}           Clear existing app files before proceeding with deployment.
  ${yellow('--no-apply')}            Submit the deployment as a change but do not apply it yet.
  ${OPTION_KEEP_STAGED}
  ${yellow('-i, --immediate')}       Deploy files instantly (bypasses the change workflow).
  ${OPTIONS_HELP}
  ${OPTION_HELP}
    
Notes:

- ${NOTE_KEEP_STAGED}`;

const doc = `${DEPLOY_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${DEPLOY_DESCRIPTION}

${usage}
`;

export const logHelpDeploy = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
