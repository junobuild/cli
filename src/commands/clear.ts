import {isNullish} from '@dfinity/utils';
import {hasArgs, nextArg} from '@junobuild/cli-tools';
import {yellow} from 'kleur';
import {junoConfigExist} from '../configs/juno.config';
import {clearAsset, clear as clearServices} from '../services/clear.services';
import {consoleNoConfigFound} from '../utils/msg.utils';

export const clear = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    consoleNoConfigFound();
    return;
  }

  if (hasArgs({args, options: ['-f', '--fullpath', '--fullPath']})) {
    const file =
      nextArg({args, option: '-f'}) ??
      nextArg({args, option: '--fullpath'}) ??
      nextArg({args, option: '--fullPath'});

    if (isNullish(file)) {
      console.log(`You did not provide a ${yellow('fullPath')} to delete.`);
      return;
    }

    await clearAsset({fullPath: file, args});
    return;
  }

  await clearServices(args);
};
