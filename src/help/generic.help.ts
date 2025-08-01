import {cyan, green, yellow} from 'kleur';
import {OPTIONS_ENV, OPTION_HELP} from '../constants/help.constants';
import {helpOutput} from './common.help';
import {TITLE} from './help';

const usage = (
  command: string
): string => `Usage: ${green('juno')} ${cyan(command)} ${yellow('[options]')}

Options:
  ${OPTION_HELP}`;

const help = ({command, description}: {command: string; description: string}) => `${TITLE}

${description}

${usage(command)}
`;

const helpWithMode = ({command, description}: {command: string; description: string}) => `${TITLE}

${description}

${usage(command)}
  ${OPTIONS_ENV}
`;

const doc = ({command, description}: {command: string; description: string}) => `${description}

\`\`\`
${usage(command)}
\`\`\`
`;

const docWithMode = ({
  command,
  description
}: {
  command: string;
  description: string;
}) => `${description}

\`\`\`
${usage(command)}
  ${OPTIONS_ENV}
\`\`\`
`;

export const logHelp = ({
  args,
  ...rest
}: {
  args?: string[];
  command: string;
  description: string;
}) => {
  console.log(helpOutput(args) === 'doc' ? doc(rest) : help(rest));
};

export const logHelpWithMode = ({
  args,
  ...rest
}: {
  args?: string[];
  command: string;
  description: string;
}) => {
  console.log(helpOutput(args) === 'doc' ? docWithMode(rest) : helpWithMode(rest));
};
