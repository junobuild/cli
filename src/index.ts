import {red} from 'kleur';
import {login, logout} from './commands/auth';
import {clear} from './commands/clear';
import {config} from './commands/config';
import {deploy} from './commands/deploy';
import {help, helpCommand, helpUpgrade} from './commands/help';
import {init} from './commands/init';
import {upgrade} from './commands/upgrade';
import {version as versionCommand} from './commands/version';

export const run = async () => {
  const [cmd, ...rest] = process.argv.slice(2);

  const helpArgs = ['-h', '--help'];
  if (rest?.find((arg) => helpArgs.includes(arg)) !== undefined) {
    switch (cmd) {
      case 'upgrade':
        console.log(helpUpgrade);
        break;
      default:
        console.log(helpCommand(cmd));
    }
    return;
  }

  switch (cmd) {
    case 'login':
      await login();
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
      await upgrade();
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
