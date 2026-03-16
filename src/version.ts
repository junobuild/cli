import {checkCliVersion, checkEmulatorVersion} from './services/version/version.check.services';
import {isHeadless} from './utils/process.utils';

export const checkWeeklyVersions = async ({cmd}: {cmd: string}) => {
  // No check if used in headless mode
  if (isHeadless()) {
    return;
  }

  await checkCliVersion();

  if (['functions', 'fn'].includes(cmd)) {
    await checkEmulatorVersion();
  }
};
