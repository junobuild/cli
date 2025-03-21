import {cyan, green, magenta, yellow} from 'kleur';
import {helpOutput} from './common.help';
import {TITLE} from './help';

export const DEV_DESCRIPTION =
  'Handle development tasks like building serverless functions or running a local Internet Computer instance.';

const helpDevStart = `${magenta(
  'start'
)}               Start a local Internet Computer network in a container.`;

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

\`\`\`bash
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
