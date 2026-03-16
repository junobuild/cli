import {checkCliVersion, checkEmulatorVersion} from './services/version/version.check.services';
import {isHeadless} from './utils/process.utils';

export const checkWeeklyVersions = async ({cmd, args}: {cmd: string; args?: string[]}) => {
  // No check if used in headless mode
  if (isHeadless()) {
    return;
  }

  const [subCommand] = args ?? [];

  if (cmd === 'emulator' && ['start', 'wait'].includes(subCommand)) {
    return;
  }

  await checkCliVersion();

  if (['functions', 'fn'].includes(cmd)) {
    await checkEmulatorVersion();
  }
};
