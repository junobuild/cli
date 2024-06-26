import {type Principal} from '@dfinity/principal';
import {assertAnswerCtrlC} from '@junobuild/cli-tools';
import {bold, green, red} from 'kleur';
import prompts from 'prompts';
import {addCliMissionControl, addCliOrbiter, addCliSatellite, getUse} from '../configs/cli.config';
import {CONSOLE_URL} from '../constants/constants';
import {type AssetKey} from '../types/asset-key';
import {terminalLink} from '../utils/links.utils';
import {confirmAndExit} from '../utils/prompt.utils';

export const reuseController = async (controller: Principal) => {
  const segment = await selectSegment();

  console.log(
    `Great. Before completing the setup, you'll need to add the controller to your ${segment} in Juno's console.\n\nHere are the steps to follow:`
  );

  await setControllerManually({controller, segment});

  const {segmentId}: {segmentId: string} = await prompts({
    type: 'text',
    name: 'segmentId',
    message: `Good. So, what's the ${green(
      `${segment} ID`
    )} to which you just added the controller?`
  });

  if (segmentId === undefined) {
    console.log(`${red(`The ${segment} ID cannot be undefined.`)}`);
    return;
  }

  const profile = getUse();

  switch (segment) {
    case 'orbiter':
      saveOrbiter({profile, segmentId});
      break;
    case 'mission_control':
      saveMissionControl({profile, segmentId});
      break;
    default:
      await saveSatellite({profile, segmentId});
  }

  console.log(
    `\nDone. The ${segment} ${green(`${segmentId}`)} has been configured for your terminal. ✅`
  );
};

const saveSatellite = async ({
  profile,
  segmentId
}: {
  profile: string | undefined;
  segmentId: string;
}) => {
  const {name}: {name: string} = await prompts({
    type: 'text',
    name: 'name',
    message: `Can you please provide a name for this satellite?`
  });

  if (name === undefined) {
    console.log(`${red(`The name is mandatory.`)}`);
    return;
  }

  addCliSatellite({
    profile,
    satellite: {
      p: segmentId,
      n: name
    }
  });
};

const saveMissionControl = ({
  profile,
  segmentId
}: {
  profile: string | undefined;
  segmentId: string;
}) => {
  addCliMissionControl({profile, missionControl: segmentId});
};

const saveOrbiter = ({profile, segmentId}: {profile: string | undefined; segmentId: string}) => {
  addCliOrbiter({
    profile,
    orbiter: {
      p: segmentId
    }
  });
};

const selectSegment = async (): Promise<AssetKey> => {
  const {segment}: {segment: string} = await prompts({
    type: 'select',
    name: 'segment',
    message: 'Which new segment would you like to authorize with your controller?',
    choices: [
      {title: 'A satellite', value: 'satellite'},
      {title: 'The orbiter for the analytics', value: 'orbiter'},
      {title: 'Your mission control', value: 'mission_control'}
    ],
    initial: 0
  });

  assertAnswerCtrlC(segment);

  return segment as AssetKey;
};

const setControllerManually = async ({
  segment,
  controller
}: {
  segment: AssetKey;
  controller: Principal;
}) => {
  const url = `${CONSOLE_URL}${
    segment === 'orbiter' ? '/analytics' : segment === 'satellite' ? '' : '/mission-control'
  }`;

  console.log(
    `\n1. Open the "${segment === 'orbiter' ? 'Settings' : 'Controllers'}" tab on ${terminalLink(
      url
    )}`
  );
  console.log(
    `2. Add the controller ${green(controller.toText())} to your ${segment} with the ${bold(
      'ADMIN'
    )} scope`
  );
  console.log(`3. Copy the ${green(`${segment} ID`)} to which you added the controller\n`);

  await confirmAndExit('Have you completed this step?');
};
