import {cyan, green, magenta} from 'kleur';
import {helpOutput, TITLE} from './help';

export const DEV_DESCRIPTION =
  'Handle development-related tasks such as building and deploying locally using Cargo and Docker.';

const helpDevBuild = `${magenta('build')}               Compile satellite features using Cargo.`;
const helpDevStart = `${magenta(
  'start'
)}               Start a local Internet Computer network, encapsulated in a Docker environment.`;

export const helpDevContinue = `${helpDevBuild}
  ${helpDevStart}`;

const usage = `Usage: ${green('juno')} ${cyan('dev')} ${magenta('<subcommand>')}

Subcommands:
  ${helpDevBuild}
  ${magenta(
    'eject'
  )}               Create a Rust template for custom satellite feature hooks and extensions.
  ${helpDevStart}
  ${magenta('stop')}                Stop the Docker environment.`;

const doc = `${DEV_DESCRIPTION}

\`\`\`bash
${usage}
\`\`\`
`;

const help = `${TITLE}

${usage}
`;

export const logHelpDev = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
