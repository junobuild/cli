import {printVersion} from '../services/version/version.print.services';

export const logVersion = async () => {
  await printVersion();
};
