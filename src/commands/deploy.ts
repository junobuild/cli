import {hasArgs} from '@junobuild/cli-tools';
import {junoConfigExist} from '../configs/juno.config';
import {clear} from '../services/clear.services';
import {executeDeploy} from '../services/deploy/deploy.execute.services';
import {links} from '../services/links.services';
import {init} from './init';

export const deploy = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    await init();
  }

  if (hasArgs({args, options: ['-c', '--clear']})) {
    await clear(args);
  }

  await executeDeploy(args);

  await links(args);
};
