import {cyan, green, magenta, yellow} from 'kleur';
import {OPTION_HELP, OPTIONS_ENV, SNAPSHOT_UPLOAD_DESCRIPTION} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';
import {TARGET_OPTION_NOTE, targetOption} from './target.help';

const usage = `Usage: ${green('juno')} ${cyan('snapshot')} ${magenta('upload')} ${yellow('[options]')}

Options:
  ${yellow('--dir')}                 Path to the snapshot directory that contains the metadata.json and chunks.
  ${targetOption('snapshot')}    
  ${yellow('--target-id')}           The module ID of a specific target to upload the snapshot to.
  ${OPTIONS_ENV}
  ${OPTION_HELP}
  
Notes:

${TARGET_OPTION_NOTE}`;

const doc = `${SNAPSHOT_UPLOAD_DESCRIPTION}

\`\`\`
${usage}
\`\`\`
`;

const help = `${TITLE}

${SNAPSHOT_UPLOAD_DESCRIPTION}

${usage}
`;

export const logHelpSnapshotUpload = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
