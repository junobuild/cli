import {green, red} from 'kleur';
import {deleteUse, getProfiles, getUse, saveUse} from '../configs/auth.config';
import {hasArgs, nextArg} from '../utils/args.utils';

export const use = (args?: string[]) => {
  if (hasArgs({args, options: ['-l', '--list']})) {
    listProfile();
    return;
  }

  switchProfile(args);
};

const listProfile = () => {
  const profiles = getProfiles();

  if (profiles === undefined) {
    console.log('No particular profiles available. Using default.');
    return;
  }

  const use = getUse();

  console.log('Available profiles:\n');
  console.log(
    Object.keys(profiles)
      .map((profile) => (profile === use ? `${green(profile)} (currently selected)` : `${profile}`))
      .join('\n')
  );
};

const switchProfile = (args?: string[]) => {
  const profile = nextArg({args, option: '-p'}) ?? nextArg({args, option: '--profile'});

  if (profile === undefined) {
    console.log(`${red('No profile provided.')}`);
    return;
  }

  if (profile === 'default') {
    deleteUse();

    console.log(`Now using ${green('default')}.`);
    return;
  }

  const profiles = getProfiles();

  if (profiles?.[profile] === undefined) {
    console.log(`${red('No corresponding profile found.')}`);
    return;
  }

  saveUse(profile);

  console.log(`Now using ${green(profile)}.`);
};
