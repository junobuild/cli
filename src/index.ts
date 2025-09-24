import {hasArgs} from '@junobuild/cli-tools';
import {red} from 'kleur';
import {login, logout} from './commands/auth';
import {changes, helpChanges} from './commands/changes';
import {config} from './commands/config';
import {clear, helpClear} from './commands/deprecated/clear';
import {deploy, helpDeploy} from './commands/deprecated/deploy';
import {dev, helpDev} from './commands/dev';
import {emulator, helpEmulator} from './commands/emulator';
import {functions, helpFunctions} from './commands/functions';
import {helpHosting, hosting} from './commands/hosting';
import {init} from './commands/init';
import {open} from './commands/open';
import {helpRun, run as runCmd} from './commands/run';
import {snapshot} from './commands/snapshot';
import {startStop} from './commands/start-stop';
import {status} from './commands/status';
import {upgrade} from './commands/upgrade';
import {version as versionCommand} from './commands/version';
import {whoami} from './commands/whoami';
import {logHelpConfig} from './help/config.help';
import {help} from './help/help';
import {logHelpInit} from './help/init.help';
import {logHelpLogin} from './help/login.help';
import {logHelpLogout} from './help/logout.help';
import {logHelpOpen} from './help/open.help';
import {logHelpSnapshot} from './help/snapshot.help';
import {logHelpStart} from './help/start.help';
import {logHelpStatus} from './help/status.help';
import {logHelpStop} from './help/stop.help';
import {logHelpUpgrade} from './help/upgrade.help';
import {logHelpVersion} from './help/version.help';
import {logHelpWhoAmI} from './help/whoami.help';
import {checkNodeVersion} from './utils/env.utils';

export const run = async () => {
  const {valid} = checkNodeVersion();

  if (valid === 'error') {
    console.error(`Cannot detect your Node runtime version. Is NodeJS installed on your machine?`);
    return;
  }

  if (!valid) {
    process.exit(1);
  }

  const [cmd, ...args] = process.argv.slice(2);

  // Special use case if dev runs "juno --help"
  if (['-h', '--help'].includes(cmd)) {
    console.log(help);
    return;
  }

  // Special use case if dev runs "juno --version"
  if (['-v', '--version'].includes(cmd)) {
    await versionCommand();
    return;
  }

  if (hasArgs({args, options: ['-h', '--help']})) {
    switch (cmd) {
      case 'login':
        logHelpLogin(args);
        break;
      case 'upgrade':
        logHelpUpgrade(args);
        break;
      case 'open':
        logHelpOpen(args);
        break;
      case 'config':
        logHelpConfig(args);
        break;
      case 'clear':
        helpClear(args);
        break;
      case 'deploy':
        helpDeploy(args);
        break;
      case 'hosting':
        helpHosting(args);
        break;
      case 'emulator':
        helpEmulator(args);
        break;
      case 'dev':
        helpDev(args);
        break;
      case 'run':
        helpRun(args);
        break;
      case 'fn':
      case 'functions':
        helpFunctions(args);
        break;
      case 'snapshot':
        logHelpSnapshot(args);
        break;
      case 'init':
        logHelpInit(args);
        break;
      case 'logout':
        logHelpLogout(args);
        break;
      case 'version':
        logHelpVersion(args);
        break;
      case 'status':
        logHelpStatus(args);
        break;
      case 'whoami':
        logHelpWhoAmI(args);
        break;
      case 'stop':
        logHelpStop(args);
        break;
      case 'start':
        logHelpStart(args);
        break;
      case 'changes':
        helpChanges(args);
        break;
      default:
        console.log(red('Unknown command.'));
        console.log(help);
    }
    return;
  }

  switch (cmd) {
    case 'login':
      await login(args);
      break;
    case 'logout':
      await logout();
      break;
    case 'init':
      await init(args);
      break;
    case 'deploy':
      await deploy(args);
      break;
    case 'config':
      await config(args);
      break;
    case 'clear':
      await clear();
      break;
    case 'version':
      await versionCommand();
      break;
    case 'status':
      await status();
      break;
    case 'open':
      await open(args);
      break;
    case 'upgrade':
      await upgrade(args);
      break;
    case 'whoami':
      await whoami();
      break;
    case 'stop':
      await startStop({args, action: 'stop'});
      break;
    case 'start':
      await startStop({args, action: 'start'});
      break;
    case 'emulator':
      await emulator(args);
      break;
    case 'hosting':
      await hosting(args);
      break;
    case 'dev':
      await dev(args);
      break;
    case 'run':
      await runCmd(args);
      break;
    case 'fn':
    case 'functions':
      await functions(args);
      break;
    case 'snapshot':
      await snapshot(args);
      break;
    case 'changes':
      await changes(args);
      break;
    case 'help':
      console.log(help);
      break;
    default:
      console.log(red('Unknown command.'));
      console.log(help);
  }
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  try {
    await run();
  } catch (err: unknown) {
    console.log(`${red('An unexpected error happened 😫.')}\n`);
    console.log(typeof err === 'string' ? err : err instanceof Error ? err.message : undefined);
    process.exit(1);
  }
})();
