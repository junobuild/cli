import {hasArgs} from '@junobuild/cli-tools';
import {noJunoConfig} from '../configs/juno.config';
import {deploy as deployServices} from '../services/assets/deploy.services';
import {config} from '../services/config/config.services';
import {links} from '../services/links.services';
import {init} from './init';

export const deploy = async (args?: string[]) => {
  if (await noJunoConfig()) {
    await init();
  }

  await deployServices(args);

  const configOption = hasArgs({args, options: ['--config']});
  if (configOption) {
    console.log('');
    await config(args);
  }

  await links();
};
