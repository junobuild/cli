import {isNullish} from '@junobuild/utils';
import {yellow} from 'kleur';
import {junoConfigExist} from '../configs/juno.config';
import {clearAsset, clear as clearServices} from '../services/clear.services';
import {hasArgs, nextArg} from '../utils/args.utils';
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

    await clearAsset(file);
    return;
  }

  await clearServices();
};
