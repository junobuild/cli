import {hasArgs} from '@junobuild/cli-tools';
import {junoConfigExist} from '../configs/juno.config';
import {config} from '../services/config/config.services';
import {deploy as deployServices} from '../services/deploy.services';
import {links} from '../services/links.services';
import {init} from './init';

export const deploy = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    await init();
  }

  await deployServices(args);

  const configOption = hasArgs({args, options: ['--config']});
  if (configOption) {
    console.log('');
    await config();
  }

  await links();
};
