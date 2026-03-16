import {checkVersions} from './services/version/version.check.services';
import {isHeadless} from './utils/process.utils';

export const checkWeeklyVersions = async ({cmd}: {cmd: string}) => {
  // No check if used in headless mode
  if (isHeadless()) {
    return;
  }

  // {withEmulator: ["functions", "fn"].includes(cmd)}
  await checkVersions();
};
