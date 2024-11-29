import {hasArgs} from '@junobuild/cli-tools';
import {red} from 'kleur';
import {login, logout} from './commands/auth';
import {backup} from './commands/backup';
import {clear} from './commands/clear';
import {config} from './commands/config';
import {deploy} from './commands/deploy';
import {dev} from './commands/dev';
import {init} from './commands/init';
import {open} from './commands/open';
import {startStop} from './commands/start-stop';
import {upgrade} from './commands/upgrade';
import {use} from './commands/use';
import {version as versionCommand} from './commands/version';
import {whoami} from './commands/whoami';
import {logHelpBackup} from './help/backup.help';
import {logHelpClear} from './help/clear.help';
import {logHelpConfig} from './help/config.help';
import {logHelpDeploy} from './help/deploy.help';
import {logHelpDev} from './help/dev.help';
import {help} from './help/help';
import {logHelpInit} from './help/init.help';
import {logHelpLogin} from './help/login.help';
import {logHelpLogout} from './help/logout.help';
import {logHelpOpen} from './help/open.help';
import {logHelpStart} from './help/start.help';
import {logHelpStop} from './help/stop.help';
import {logHelpUpgrade} from './help/upgrade.help';
import {logHelpUse} from './help/use.help';
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
    await versionCommand(args);
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
      case 'use':
        logHelpUse(args);
        break;
      case 'clear':
        logHelpClear(args);
        break;
      case 'config':
        logHelpConfig(args);
        break;
      case 'deploy':
        logHelpDeploy(args);
        break;
      case 'dev':
        logHelpDev(args);
        break;
      case 'backup':
        logHelpBackup(args);
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
      case 'whoami':
        logHelpWhoAmI(args);
        break;
      case 'stop':
        logHelpStop(args);
        break;
      case 'start':
        logHelpStart(args);
        break;
      default:
        console.log(`${red('Unknown command.')}`);
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
      await config();
      break;
    case 'clear':
      await clear(args);
      break;
    case 'version':
      await versionCommand(args);
      break;
    case 'open':
      await open(args);
      break;
    case 'upgrade':
      await upgrade(args);
      break;
    case 'whoami':
      await whoami(args);
      break;
    case 'use':
      await use(args);
      break;
    case 'stop':
      await startStop({args, action: 'stop'});
      break;
    case 'start':
      await startStop({args, action: 'start'});
      break;
    case 'dev':
      await dev(args);
      break;
    case 'backup':
      await backup(args);
      break;
    case 'help':
      console.log(help);
      break;
    default:
      console.log(`${red('Unknown command.')}`);
      console.log(help);
  }
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  try {
    await run();
  } catch (err: unknown) {
    console.log(`${red('An unexpected error happened 😫.')}\n`);
    console.log(err);
    process.exit(1);
  }
})();
