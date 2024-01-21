import {red} from 'kleur';
import {login, logout} from './commands/auth';
import {clear} from './commands/clear';
import {config} from './commands/config';
import {deploy} from './commands/deploy';
import {eject} from './commands/eject';
import {
  help,
  helpClear,
  helpCommand,
  helpDeploy,
  helpDev,
  helpLogin,
  helpOpen,
  helpUpgrade,
  helpUse
} from './commands/help';
import {init} from './commands/init';
import {links} from './commands/links';
import {open} from './commands/open';
import {upgrade} from './commands/upgrade';
import {use} from './commands/use';
import {version as versionCommand} from './commands/version';
import {whoami} from './commands/whoami';
import {hasArgs} from './utils/args.utils';
import {checkNodeVersion} from './utils/env.utils';

export const run = async () => {
  const {valid} = checkNodeVersion();

  if (!valid) {
    return;
  }

  const [cmd, ...args] = process.argv.slice(2);

  // Special use case if dev runs "juno --help"
  if (['-h', '--help'].includes(cmd)) {
    console.log(help);
    return;
  }

  if (hasArgs({args, options: ['-h', '--help']})) {
    switch (cmd) {
      case 'login':
        console.log(helpLogin);
        break;
      case 'upgrade':
        console.log(helpUpgrade);
        break;
      case 'open':
        console.log(helpOpen);
        break;
      case 'use':
        console.log(helpUse);
        break;
      case 'clear':
        console.log(helpClear);
        break;
      case 'deploy':
        console.log(helpDeploy);
        break;
      case 'dev':
        console.log(helpDev);
        break;
      default:
        console.log(helpCommand(cmd));
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
      await init();
      break;
    case 'deploy':
      await deploy(args);
      await links();
      break;
    case 'config':
      await config();
      break;
    case 'clear':
      await clear(args);
      break;
    case 'version':
      await versionCommand();
      break;
    case 'open':
      await open(args);
      break;
    case 'upgrade':
      await upgrade(args);
      break;
    case 'whoami':
      whoami();
      await links();
      break;
    case 'use':
      use(args);
      break;
    case 'eject':
      await eject();
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
    console.log(`${red('An unexpected error happened 😫.')}`, err);
  }
})();
