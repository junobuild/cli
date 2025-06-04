import {magenta, yellow} from 'kleur';

export const CHANGES_DESCRIPTION = 'Review and apply changes submitted to your module.';
export const CLEAR_DESCRIPTION =
  'Clear existing app code by removing JavaScript, HTML, CSS, and other files from your satellite.';
export const CONFIG_DESCRIPTION = 'Apply configuration to satellite.';
export const DEPLOY_DESCRIPTION = 'Deploy your app to your satellite.';
export const DEV_DESCRIPTION =
  'Handle developer tasks like starting/stopping a local network or building functions.';
export const FUNCTIONS_DESCRIPTION = "Build and upgrade your satellite's serverless functions.";
export const INIT_DESCRIPTION = 'Set up your project.';
export const LOGIN_DESCRIPTION =
  'Generate an authentication for use in non-interactive environments.';
export const LOGOUT_DESCRIPTION =
  'Log out of the current device. ⚠️  This action does not remove controllers from the module.';
export const OPEN_DESCRIPTION = 'Open your satellite in your browser.';
export const SNAPSHOT_DESCRIPTION = 'Handle snapshot-related tasks.';
export const START_DESCRIPTION = 'Start a module.';
export const STOP_DESCRIPTION = 'Stop a module.';
export const UPGRADE_DESCRIPTION = 'Upgrade a module to a new version.';
export const USE_DESCRIPTION = 'Switch between multiple profiles.';
export const VERSION_DESCRIPTION = 'Check the version of the modules and CLI.';
export const WHOAMI_DESCRIPTION =
  'Display your current profile, controller, and links to your satellite.';

export const DEV_START_DESCRIPTION = 'Start a local Internet Computer network in a container.';

export const FUNCTIONS_PUBLISH_DESCRIPTION = 'Publish a new version of your serverless functions.';
export const FUNCTIONS_UPGRADE_DESCRIPTION = 'Upgrade your serverless functions.';
export const FUNCTIONS_BUILD_DESCRIPTION = 'Build your serverless functions.';
export const FUNCTIONS_EJECT_DESCRIPTION =
  'Generate the required files to begin developing serverless functions in your project.';

export const FUNCTIONS_BUILD_NOTES = `- If no language is provided, the CLI attempts to determine the appropriate build.
- Language can be shortened to ${magenta('rs')} for Rust, ${magenta('ts')} for TypeScript and ${magenta('mjs')} for JavaScript.
- The path option maps to ${magenta('--manifest-path')} for Rust (Cargo) or to the source file for TypeScript and JavaScript (e.g. ${magenta('index.ts')} or ${magenta('index.mjs')}).
- The watch option rebuilds when source files change, with a default debounce delay of 10 seconds; optionally, pass a delay in milliseconds.`;

export const CHANGES_LIST_DESCRIPTION = 'List all submitted or applied changes.';
export const CHANGES_APPLY_DESCRIPTION = 'Apply a submitted change.';
export const CHANGES_REJECT_DESCRIPTION = 'Reject a change.';

export const OPTION_KEEP_STAGED = `${yellow('-k, --keep-staged')}     Keep staged assets in memory after applying the change.`;
export const OPTION_HASH = `${yellow('--hash')}                The expected hash of all included changes (for verification).`;
export const OPTION_HELP = `${yellow('-h, --help')}            Output usage information.`;
export const OPTION_SRC = `${yellow('-s, --src')}             A path to a specific local gzipped WASM file to publish.`;
export const OPTIONS_UPGRADE = `${yellow('-r, --reset')}           Reset to the initial state.
  ${yellow('--clear-chunks')}        Clear any previously uploaded WASM chunks (applies if the WASM size is greater than 2MB).
  ${yellow('--no-snapshot')}         Skip creating a snapshot before upgrading.`;

export const NOTE_KEEP_STAGED = `The option ${yellow('--keep-staged')} only applies when ${yellow('--no-apply')} is NOT used (i.e. the change is applied immediately).`;
