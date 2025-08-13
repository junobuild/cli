import {config as configServices} from '../services/config/config.services';

export const config = async (args?: string[]) => {
  await configServices(args);
};
