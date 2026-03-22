import {cyan, green, magenta, yellow} from 'kleur';
import {STORAGE_DEPLOY_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('storage')} ${magenta('deploy')} ${yellow('[options]')}

Options:
  ${yellow('--batch')}              Number of files to upload per batch.
  ${yellow('--prune')}              Remove stale remote assets not present in local source after deploy.
  ${yellow('-m, --mode')}            Choose which environment to use (production, staging, development).
  ${yellow('-h, --help')}            Output usage information.`;

const doc = `${STORAGE_DEPLOY_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${STORAGE_DEPLOY_DESCRIPTION}

${usage}
`;

export const logHelpStorageDeploy = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
