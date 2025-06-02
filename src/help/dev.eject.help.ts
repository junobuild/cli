import {cyan, green, magenta, yellow} from 'kleur';
import {DEV_EJECT_DESCRIPTION, OPTION_HELP} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('dev')} ${magenta('eject')} ${yellow('[options]')}

Options:
  ${yellow('-l, --lang')}            Specify the language for building the serverless functions: ${magenta('rust')}, ${magenta('typescript')} or ${magenta('javascript')}.
  ${OPTION_HELP}
  
Notes:

- Language can be shortened to ${magenta('rs')} for Rust, ${magenta('ts')} for TypeScript and ${magenta('mjs')} for JavaScript.`;

const doc = `${DEV_EJECT_DESCRIPTION}

\`\`\`
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
