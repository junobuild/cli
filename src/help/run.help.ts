import {cyan, green, yellow} from 'kleur';
import {RUN_DESCRIPTION, OPTIONS_ENV, OPTION_HELP} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('run')} ${yellow('[options]')}

Options:
  ${yellow('-s, --src')}        The path to your JavaScript or TypeScript script.
  ${OPTIONS_ENV}
  ${OPTION_HELP}`;

const doc = `${RUN_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${RUN_DESCRIPTION}

${usage}
`;

export const logHelpRun = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
