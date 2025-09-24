import {logHelpHostingDeploy} from '../../help/hosting.deploy.help';
import {deploy as deployServices} from '../../services/assets/deploy.services';

/**
 * @deprecated alias for backwards compatibility
 */
export const deploy = async (args?: string[]) => {
  await deployServices(args);
};

/**
 * @deprecated
 */
export const helpDeploy = (args?: string[]) => {
  logHelpHostingDeploy(args);
};
