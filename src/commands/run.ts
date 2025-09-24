import {logHelpRun} from '../help/run.help';
import {run as runServices} from '../services/run.services';

export const run = async (args?: string[]) => {
  await runServices(args);
};

export const helpRun = (args?: string[]) => {
  logHelpRun(args);
};
