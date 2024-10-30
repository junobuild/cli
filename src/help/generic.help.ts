import {cyan, green, yellow} from 'kleur';
import {helpMode, helpOutput, TITLE} from './help';

const usage = (
  command: string
): string => `Usage: ${green('juno')} ${cyan(command)} ${yellow('[options]')}

Options:
  ${yellow('-h, --help')}            Output usage information.`;

const help = (command: string) => `${TITLE}

${usage(command)}
`;

const helpWithMode = (command: string) => `${TITLE}

${usage(command)}
  ${helpMode}
`;

const doc = (command: string) => `\`\`\`bash
${usage(command)}
\`\`\`
`;

const docWithMode = (command: string) => `\`\`\`bash
${usage(command)}
  ${helpMode}
\`\`\`
`;

export const logHelp = ({args, command}: {args?: string[]; command: string}) => {
  console.log(helpOutput(args) === 'doc' ? doc(command) : help(command));
};

export const logHelpWithMode = ({args, command}: {args?: string[]; command: string}) => {
  console.log(helpOutput(args) === 'doc' ? docWithMode(command) : helpWithMode(command));
};
