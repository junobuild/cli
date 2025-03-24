import {cyan, green, yellow} from 'kleur';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';

export const DEPLOY_DESCRIPTION = 'Deploy your dapp to your satellite.';

const usage = `Usage: ${green('juno')} ${cyan('deploy')} ${yellow('[options]')}

Options:
  ${yellow('-c, --clear')}           Clear existing dapp files before proceeding with deployment.
  ${helpMode}
  ${yellow('-h, --help')}            Output usage information.`;

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
