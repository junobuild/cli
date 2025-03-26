import {cyan, green, magenta, yellow} from 'kleur';
import {DEV_DESCRIPTION, DEV_START_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const helpDevStart = `${magenta('start')}               ${DEV_START_DESCRIPTION}`;

const helpDevBuild = `${magenta('build')}               Build your serverless functions. The local server supports live reloading.`;

export const helpDevContinue = `${helpDevBuild}
  ${helpDevStart}`;

const usage = `Usage: ${green('juno')} ${cyan('dev')} ${magenta('<subcommand>')} ${yellow('[options]')}

Subcommands:
  ${helpDevBuild}
  ${magenta(
    'eject'
  )}               Scaffold the necessary files to start coding and building functions in your project.
  ${helpDevStart}
  ${magenta('stop')}                Stop the local network.`;

const doc = `${DEV_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${DEV_DESCRIPTION}

${usage}
`;

export const logHelpDev = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
