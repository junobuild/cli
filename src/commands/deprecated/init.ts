import {logHelpInit} from '../../help/deprecated/init.help';
import {init as initServices} from '../../services/config/init.services';

/**
 * @deprecated alias for backwards compatibility
 */
export const init = async (args?: string[]) => {
  await initServices(args);
};

/**
 * @deprecated
 */
export const helpInit = (args?: string[]) => {
  logHelpInit(args);
};
