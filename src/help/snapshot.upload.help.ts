import {cyan, green, magenta, yellow} from 'kleur';
import {
  FUNCTIONS_BUILD_DESCRIPTION,
  FUNCTIONS_BUILD_NOTES,
  OPTION_HELP,
  OPTIONS_BUILD, OPTIONS_ENV, SNAPSHOT_UPLOAD_DESCRIPTION
} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = `Usage: ${green('juno')} ${cyan('snapshot')} ${magenta('upload')} ${yellow('[options]')}

Options:
  ${yellow('--dir')}           Path to the snapshot directory that contains the metadata.json and chunks.
  ${OPTIONS_ENV}
  ${OPTION_HELP}`;

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
