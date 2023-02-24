import {red} from 'kleur';
import {nextArg} from '../utils/args.utils';
import {deleteUse, getProfiles, saveUse} from '../utils/auth.config.utils';

export const use = (args?: string[]) => {
  const profile = nextArg({args, option: '-p'}) ?? nextArg({args, option: '--profile'});

  if (profile === undefined) {
    console.log(`${red('No profile provided.')}`);
    return;
  }

  if (profile === 'default') {
    deleteUse();
    return;
  }

  const profiles = getProfiles();

  if (profiles?.[profile] === undefined) {
    console.log(`${red('No corresponding profile found.')}`);
    return;
  }

  saveUse(profile);
};
