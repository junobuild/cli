import {type Principal} from '@dfinity/principal';
import {assertAnswerCtrlC} from '@junobuild/cli-tools';
import {bold, green, red} from 'kleur';
import prompts from 'prompts';
import {addCliMissionControl, addCliOrbiter, addCliSatellite, getUse} from '../configs/cli.config';
import {ENV} from '../env';
import {type AssetKey} from '../types/asset-key';
import {displaySegment} from '../utils/display.utils';
import {terminalLink} from '../utils/links.utils';
import {confirmAndExit} from '../utils/prompt.utils';

export const reuseController = async (controller: Principal) => {
  const segment = await selectSegment();

  console.log(
    `Before you finish setting things up, you'll need to add the access key to ${displaySegment(segment)} in Juno's console.\n\nFollow these steps:`
  );

  await setControllerManually({controller, segment});

  const {segmentId}: {segmentId: string | undefined} = await prompts({
    type: 'text',
    name: 'segmentId',
    message: `Good. So, what's the ${green(
      `${displaySegment(segment)} ID`
    )} to which you just added the access key?`
  });

  if (segmentId === undefined) {
    console.log(red(`The ${displaySegment(segment)} ID cannot be undefined.`));
    return;
  }

  const profile = await getUse();

  switch (segment) {
    case 'orbiter':
      await saveOrbiter({profile, segmentId});
      break;
    case 'mission_control':
      await saveMissionControl({profile, segmentId});
      break;
    default:
      await saveSatellite({profile, segmentId});
  }

  console.log(
    `\nDone. The ${displaySegment(segment)} ${green(segmentId)} has been configured for your terminal. ✅`
  );
};

const saveSatellite = async ({
  profile,
  segmentId
}: {
  profile: string | undefined;
  segmentId: string;
}) => {
  const {name}: {name: string | undefined} = await prompts({
    type: 'text',
    name: 'name',
    message: `Can you please provide a name for this satellite?`
  });

  if (name === undefined) {
    console.log(red(`The name is mandatory.`));
    return;
  }

  await addCliSatellite({
    profile,
    satellite: {
      p: segmentId,
      n: name
    }
  });
};

const saveMissionControl = async ({
  profile,
  segmentId
}: {
  profile: string | undefined;
  segmentId: string;
}) => {
  await addCliMissionControl({profile, missionControl: segmentId});
};

const saveOrbiter = async ({
  profile,
  segmentId
}: {
  profile: string | undefined;
  segmentId: string;
}) => {
  await addCliOrbiter({
    profile,
    orbiter: {
      p: segmentId
    }
  });
};

const selectSegment = async (): Promise<AssetKey> => {
  const {segment}: {segment: AssetKey} = await prompts({
    type: 'select',
    name: 'segment',
    message: 'Which module would you like to authorize with your access key?',
    choices: [
      {title: 'A satellite', value: 'satellite'},
      {title: 'The orbiter (analytics)', value: 'orbiter'},
      {title: 'Your mission control', value: 'mission_control'}
    ],
    initial: 0
  });

  assertAnswerCtrlC(segment);

  return segment;
};

const setControllerManually = async ({
  segment,
  controller
}: {
  segment: AssetKey;
  controller: Principal;
}) => {
  const url = `${ENV.console.urls.root}${
    segment === 'orbiter'
      ? '/analytics?tab=setup'
      : segment === 'satellite'
        ? ''
        : '/mission-control?tab=setup'
  }`;

  if (segment === 'satellite') {
    console.log(
      `\n1. Go to ${terminalLink(url)}, select your Satellite, and open the ${bold('"Setup"')} tab`
    );
  } else {
    console.log(
      `\n1. Navigate to the ${bold('"Setup"')} tab of your ${displaySegment(segment)} on ${terminalLink(url)}`
    );
  }

  console.log('2. Find the "Access Keys" section and click "Add an access key"');
  console.log('3. Choose "Enter one manually"');
  console.log(`4. Paste the access key ID from your terminal: ${green(controller.toText())}`);
  console.log(`5. Select the ${bold('Administrator')} permission`);
  console.log(`6. Click ${bold('Submit')}`);
  console.log(
    `7. After the key is added, copy the ${green(`${displaySegment(segment)} ID`)} displayed\n`
  );

  await confirmAndExit('Have you completed this step?');
};
