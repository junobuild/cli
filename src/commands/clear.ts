import {junoConfigExist} from '../configs/juno.config';
import {clear as clearServices} from '../services/clear.services';
import {consoleNoConfigFound} from '../utils/msg.utils';

export const clear = async () => {
  if (!(await junoConfigExist())) {
    consoleNoConfigFound();
    return;
  }

  await clearServices();
};
