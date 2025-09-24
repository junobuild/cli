import {logHelpClear} from '../../help/deprecated/clear.help';
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
  logHelpClear(args);
};
