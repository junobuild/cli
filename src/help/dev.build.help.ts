import {cyan, green, magenta, yellow} from 'kleur';
import {helpOutput} from './common.help';
import {TITLE} from './help';

export const DEV_BUILD_DESCRIPTION = 'Build your serverless functions.';

export const helpDevBuild = `${magenta('build')}               ${DEV_BUILD_DESCRIPTION}`;

const usage = `Usage: ${green('juno')} ${cyan('dev')} ${magenta('build')} ${yellow('[options]')}

Options:
  ${yellow('-l, --lang')}            Specify the language for building the serverless functions: ${magenta('rust')}, ${magenta('typescript')} or ${magenta('javascript')}.
  ${yellow('-p, --path')}            Path to the source to bundle.
  ${yellow('-h, --help')}            Output usage information.
  
Notes:

- If no language is provided, the CLI attempts to determine the appropriate build.
- Language can be shortened to ${magenta('rs')} for Rust, ${magenta('ts')} for TypeScript and ${magenta('js')} for JavaScript.
- The path option maps to ${magenta('--manifest-path')} for Rust (Cargo) or to the source file for TypeScript and JavaScript (e.g. ${magenta('index.ts')} or ${magenta('index.mjs')}) .`;

const doc = `${DEV_BUILD_DESCRIPTION}

\`\`\`bash
${usage}
\`\`\`
`;

const help = `${TITLE}

${DEV_BUILD_DESCRIPTION}

${usage}
`;

export const logHelpDevBuild = (args?: string[]) => {
  console.log(helpOutput(args) === 'doc' ? doc : help);
};
