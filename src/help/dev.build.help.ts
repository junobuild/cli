import {cyan, green, magenta, yellow} from 'kleur';
import {DEV_BUILD_DESCRIPTION, DEV_BUILD_NOTES, OPTION_HELP} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('dev')} ${magenta('build')} ${yellow('[options]')}

Options:
  ${yellow('-l, --lang')}            Specify the language for building the serverless functions: ${magenta('rust')}, ${magenta('typescript')} or ${magenta('javascript')}.
  ${yellow('-p, --path')}            Path to the source to bundle.
  ${yellow('-w, --watch')}           Rebuild your functions automatically when source files change.
  ${OPTION_HELP}
  
Notes:

${DEV_BUILD_NOTES}`;

const doc = `${DEV_BUILD_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${DEV_BUILD_DESCRIPTION}

${usage}
`;

export const logHelpDevBuild = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
