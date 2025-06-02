import {cyan, green, magenta, yellow} from 'kleur';
import {OPTION_HELP, SNAPSHOT_DESCRIPTION} from '../constants/help.constants';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';
import {TARGET_OPTION_NOTE, targetOption} from './target.help';

const usage = `Usage: ${green('juno')} ${cyan('snapshot')} ${magenta('<subcommand>')} ${yellow('[options]')}

Subcommands:
  ${magenta('create')}               Create a snapshot of your current state.
  ${magenta('restore')}              Restore a previously created snapshot.
  ${magenta('delete')}               Delete an existing snapshot.
  
Options:
  ${targetOption('snapshot')}
  ${helpMode}
  ${OPTION_HELP}
  
Notes:

${TARGET_OPTION_NOTE}`;

const doc = `${SNAPSHOT_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${SNAPSHOT_DESCRIPTION}

${usage}
`;

export const logHelpSnapshot = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
