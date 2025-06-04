import {cyan, green, magenta, yellow} from 'kleur';
import {
  FUNCTIONS_PUBLISH_DESCRIPTION,
  NOTE_KEEP_STAGED,
  OPTION_HELP,
  OPTION_KEEP_STAGED,
  OPTION_SRC
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('functions')} ${magenta('publish')} ${yellow('[options]')}

Options:
  ${yellow('-na, --no-apply')}       Submit the release as a change but do not apply it yet.
  ${OPTION_KEEP_STAGED}
  ${OPTION_SRC}
  ${OPTION_HELP}
  
Notes:

- ${NOTE_KEEP_STAGED}`;

const doc = `${FUNCTIONS_PUBLISH_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${FUNCTIONS_PUBLISH_DESCRIPTION}

${usage}
`;

export const logHelpFunctionsPublish = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
