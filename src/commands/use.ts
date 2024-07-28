import {hasArgs, nextArg} from '@junobuild/cli-tools';
import {green, red} from 'kleur';
import {deleteUse, getProfiles, getUse, saveUse} from '../configs/cli.config';

export const use = async (args?: string[]) => {
  if (hasArgs({args, options: ['-l', '--list']})) {
    await listProfile();
    return;
  }

  await switchProfile(args);
};

const listProfile = async () => {
  const profiles = await getProfiles();

  if (profiles === undefined) {
    console.log('No particular profiles available. Using default.');
    return;
  }

  const use = await getUse();

  console.log('Available profiles:\n');
  console.log(
    Object.keys(profiles)
      .map((profile) => (profile === use ? `${green(profile)} (currently selected)` : `${profile}`))
      .join('\n')
  );
};

const switchProfile = async (args?: string[]) => {
  const profile = nextArg({args, option: '-p'}) ?? nextArg({args, option: '--profile'});

  if (profile === undefined) {
    console.log(`${red('No profile provided.')}`);
    return;
  }

  if (profile === 'default') {
    await deleteUse();

    console.log(`Now using ${green('default')}.`);
    return;
  }

  const profiles = await getProfiles();

  if (profiles?.[profile] === undefined) {
    console.log(`${red('No corresponding profile found.')}`);
    return;
  }

  await saveUse(profile);

  console.log(`Now using ${green(profile)}.`);
};
