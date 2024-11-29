import {cyan, green, magenta, yellow} from 'kleur';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';
import {TARGET_OPTION_NOTE, targetOption} from './target.help';

export const BACKUP_DESCRIPTION = 'Handle backup-related tasks.';

const usage = `Usage: ${green('juno')} ${cyan('dev')} ${magenta('<subcommand>')} ${yellow('[options]')}

Subcommands:
  ${magenta('create')}               Create a backup of your current state.
  ${magenta('restore')}              Restore a previously created backup.
  ${magenta('delete')}               Delete an existing backup
  
Options:
  ${targetOption('backup')}
  ${helpMode}
  ${yellow('-h, --help')}            Output usage information.
  
Notes:

${TARGET_OPTION_NOTE}`;

const doc = `${BACKUP_DESCRIPTION}

\`\`\`bash
${usage}
\`\`\`
`;

const help = `${TITLE}

${BACKUP_DESCRIPTION}

${usage}
`;

export const logHelpBackup = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
