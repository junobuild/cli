import {cyan, green, magenta, yellow} from 'kleur';
import {
  DEV_START_DESCRIPTION,
  FUNCTIONS_BUILD_NOTES,
  OPTION_HELP
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('dev')} ${magenta('start')} ${yellow('[options]')}

Options:
  ${yellow('-l, --lang')}            Language used when watching for file changes: ${magenta('rust')}, ${magenta('typescript')} or ${magenta('javascript')}.
  ${yellow('-p, --path')}            Path to the source file or manifest used when watching.
  ${yellow('-w, --watch')}           Rebuild your functions automatically when source files change.
  ${OPTION_HELP}
  
Notes:

- The language and path options are only used in combination with watch.
${FUNCTIONS_BUILD_NOTES}`;

const doc = `${DEV_START_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${DEV_START_DESCRIPTION}

${usage}
`;

export const logHelpDevStart = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
