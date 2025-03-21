import {cyan, green, magenta, yellow} from 'kleur';
import {helpOutput} from './common.help';
import {TITLE} from './help';

export const DEV_EJECT_DESCRIPTION =
  'Generate the required files to begin developing serverless functions in your project.';

const usage = `Usage: ${green('juno')} ${cyan('dev')} ${magenta('eject')} ${yellow('[options]')}

Options:
  ${yellow('-l, --lang')}            Specify the language for building the serverless functions: ${magenta('rust')}, ${magenta('typescript')} or ${magenta('javascript')}.
  ${yellow('-h, --help')}            Output usage information.
  
Notes:

- Language can be shortened to ${magenta('rs')} for Rust, ${magenta('ts')} for TypeScript and ${magenta('js')} for JavaScript.`;

const doc = `${DEV_EJECT_DESCRIPTION}

\`\`\`bash
${usage}
\`\`\`
`;

const help = `${TITLE}

${DEV_EJECT_DESCRIPTION}

${usage}
`;

export const logHelpDevEject = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
