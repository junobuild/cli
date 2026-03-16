import {isNullish} from '@dfinity/utils';
import prompts from 'prompts';
import {isWeeklyCheckEnabled, toggleWeeklyCheck} from '../../configs/cli.versions.config';

export const enableDisableVersionCheck = async () => {
  const current = isWeeklyCheckEnabled();

  const {enabled}: {enabled: boolean | undefined} = await prompts([
    {
      type: 'toggle',
      name: 'enabled',
      message: 'Enable weekly version check?',
      initial: current,
      active: 'yes',
      inactive: 'no'
    }
  ]);

  if (isNullish(enabled)) {
    return;
  }


  toggleWeeklyCheck(enabled);
};
