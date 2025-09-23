import {logHelpDev} from '../help/dev.help';
import {run as runServices} from '../services/run.services';

export const run = async (args?: string[]) => {
  await runServices(args);
};

export const helpRun = (args?: string[]) => {
  logHelpDev(args);
};
