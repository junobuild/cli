import {logHelpEmulatorClear} from '../../help/hosting.clear.help';
import {clear as clearServices} from '../../services/assets/clear.services';

/**
 * @deprecated alias for backwards compatibility
 */
export const clear = async (args?: string[]) => {
  await clearServices(args);
};

/**
 * @deprecated
 */
export const helpClear = (args?: string[]) => {
  logHelpEmulatorClear(args);
};
