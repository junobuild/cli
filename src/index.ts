import {red} from 'kleur';
import {login, logout} from './commands/auth';
import {clear} from './commands/clear';
import {config} from './commands/config';
import {deploy} from './commands/deploy';
import {help, helpCommand, helpLogin, helpUpgrade, helpUse} from './commands/help';
import {init} from './commands/init';
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

  if (hasArgs({args, options: ['-h', '--help']})) {
    switch (cmd) {
      case 'login':
        console.log(helpLogin);
        break;
      case 'upgrade':
        console.log(helpUpgrade);
        break;
      case 'use':
        console.log(helpUse);
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
      await deploy();
      break;
    case 'config':
      await config();
      break;
    case 'clear':
      await clear();
      break;
    case 'version':
      await versionCommand();
      break;
    case 'upgrade':
      await upgrade(args);
      break;
    case 'whoami':
      whoami();
      break;
    case 'use':
      use(args);
      break;
    case 'help':
      console.log(help);
      break;
    default:
      console.log(`${red('Unknown command.')}`);
      console.log(help);
  }
};

(async () => {
  try {
    await run();
  } catch (err: unknown) {
    console.log(`${red('An unexpected error happened 😫.')}`, err);
  }
})();
