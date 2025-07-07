import {cyan, green, magenta, yellow} from 'kleur';
import {FUNCTIONS_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('functions')} ${magenta('<subcommand>')} ${yellow('[options]')}

Subcommands:
  ${magenta('build')}                Build your functions.
  ${magenta('eject')}                Scaffold the necessary files for developing your serverless functions.
  ${magenta('init')}                 Alias for ${magenta('eject')}.
  ${magenta('publish')}              Publish a new version of your functions.
  ${magenta('upgrade')}              Upgrade your satellite's serverless functions.
  
Notes:

- The local server supports live reloading.
- You can use ${cyan('fn')} as a shortcut for ${cyan('functions')}.`;

const doc = `${FUNCTIONS_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${FUNCTIONS_DESCRIPTION}

${usage}
`;

export const logHelpFunctions = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
