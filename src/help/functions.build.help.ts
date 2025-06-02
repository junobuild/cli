import {cyan, green, magenta, yellow} from 'kleur';
import {
  FUNCTIONS_BUILD_DESCRIPTION,
  FUNCTIONS_BUILD_NOTES,
  OPTION_HELP
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('functions')} ${magenta('build')} ${yellow('[options]')}

Options:
  ${yellow('-l, --lang')}            Specify the language for building the serverless functions: ${magenta('rust')}, ${magenta('typescript')} or ${magenta('javascript')}.
  ${yellow('-p, --path')}            Path to the source to bundle.
  ${yellow('-w, --watch')}           Rebuild your functions automatically when source files change.
  ${OPTION_HELP}
  
Notes:

${FUNCTIONS_BUILD_NOTES}`;

const doc = `${FUNCTIONS_BUILD_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${FUNCTIONS_BUILD_DESCRIPTION}

${usage}
`;

export const logHelpFunctionsBuild = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
