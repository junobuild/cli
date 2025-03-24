import {cyan, green, magenta, yellow} from 'kleur';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';
import {TARGET_OPTION_NOTE, targetOption} from './target.help';

export const SNAPSHOT_DESCRIPTION = 'Handle snapshot-related tasks.';

const usage = `Usage: ${green('juno')} ${cyan('snapshot')} ${magenta('<subcommand>')} ${yellow('[options]')}

Subcommands:
  ${magenta('create')}               Create a snapshot of your current state.
  ${magenta('restore')}              Restore a previously created snapshot.
  ${magenta('delete')}               Delete an existing snapshot.
  
Options:
  ${targetOption('snapshot')}
  ${helpMode}
  ${yellow('-h, --help')}            Output usage information.
  
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
