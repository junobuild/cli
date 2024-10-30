import {cyan, green, yellow} from 'kleur';
import {helpMode, helpOutput} from './common.help';
import {TITLE} from './help';

const usage = (
  command: string
): string => `Usage: ${green('juno')} ${cyan(command)} ${yellow('[options]')}

Options:
  ${yellow('-h, --help')}            Output usage information.`;

const help = ({command, description}: {command: string; description: string}) => `${TITLE}

${description}

${usage(command)}
`;

const helpWithMode = ({command, description}: {command: string; description: string}) => `${TITLE}

${description}

${usage(command)}
  ${helpMode}
`;

const doc = ({command, description}: {command: string; description: string}) => `${description}

\`\`\`bash
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

\`\`\`bash
${usage(command)}
  ${helpMode}
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
