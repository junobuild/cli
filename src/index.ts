import {red} from 'kleur';
import {login, logout} from './commands/auth';
import {clear} from './commands/clear';
import {config} from './commands/config';
import {deploy} from './commands/deploy';
import {dev} from './commands/dev';
import {
  help,
  helpClear,
  helpCommand,
  helpConfig,
  helpDeploy,
  helpDev,
  helpLogin,
  helpOpen,
  helpUpgrade,
  helpUse
} from './commands/help';
import {init} from './commands/init';
import {open} from './commands/open';
import {upgrade} from './commands/upgrade';
import {use} from './commands/use';
import {version as versionCommand} from './commands/version';
import {whoami} from './commands/whoami';
import {hasArgs} from './utils/args.utils';
import {checkNodeVersion} from './utils/env.utils';

export const run = async () => {
  const {valid} = checkNodeVersion();

  if (valid === 'error') {
    console.error(`Cannot detect your Node runtime version. Is NodeJS installed on your machine?`);
    return;
  }

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
      case 'config':
        console.log(helpConfig);
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
      use(args);
      break;
    case 'dev':
      await dev(args);
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
  }
})();
