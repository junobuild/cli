import {
  missionControlVersion as missionControlVersionLib,
  satelliteVersion as satelliteVersionLib
} from '@junobuild/admin';
import {cyan, green, red, yellow} from 'kleur';
import {clean, coerce, compare} from 'semver';
import {version as cliCurrentVersion} from '../../package.json';
import {MISSION_CONTROL_WASM_NAME, SATELLITE_WASM_NAME} from '../constants/constants';
import {actorParameters} from '../utils/actor.utils';
import {getMissionControl} from '../utils/auth.config.utils';
import {githubCliLastRelease, githubJunoLastRelease} from '../utils/github.utils';
import {junoConfigExist, readSatelliteConfig} from '../utils/satellite.config.utils';
import {satelliteKey, satelliteParameters} from '../utils/satellite.utils';

export const version = async () => {
  await cliVersion();
  await missionControlVersion();
  await satelliteVersion();
};

const cliVersion = async () => {
  const githubRelease = await githubCliLastRelease();

  if (githubRelease === undefined) {
    console.log(`${red('Cannot fetch last release version of Juno on GitHub 😢.')}`);
    return;
  }

  const {tag_name} = githubRelease;

  const latestVersion = clean(tag_name);

  if (!latestVersion) {
    console.log(`${red(`Cannot extract version from release. Reach out Juno❗️`)}`);
    return;
  }

  checkVersion({
    currentVersion: cliCurrentVersion,
    latestVersion,
    displayHint: 'CLI',
    commandLineHint: `npm i -g @junobuild/cli`
  });
};

const missionControlVersion = async () => {
  const missionControl = getMissionControl();

  if (!missionControl) {
    console.log(
      `${yellow(
        'No mission control found.'
      )} Ignore this error if your controller does not control your mission control.`
    );
    return;
  }

  const missionControlParameters = {
    missionControlId: missionControl,
    ...actorParameters()
  };

  const currentVersion = await missionControlVersionLib({
    missionControl: missionControlParameters
  });

  const displayHint = `mission control`;

  await checkSegmentVersion({
    currentVersion,
    assetKey: MISSION_CONTROL_WASM_NAME,
    displayHint
  });
};

const satelliteVersion = async () => {
  if (!(await junoConfigExist())) {
    console.log(`${yellow('No satellite configuration found.')}`);
    return;
  }

  const {satelliteId} = await readSatelliteConfig();

  const satellite = satelliteParameters(satelliteId);

  const currentVersion = await satelliteVersionLib({
    satellite
  });

  const displayHint = `satellite "${satelliteKey(satelliteId)}"`;

  await checkSegmentVersion({
    currentVersion,
    assetKey: SATELLITE_WASM_NAME,
    displayHint
  });
};

const checkSegmentVersion = async ({
  currentVersion,
  assetKey,
  displayHint
}: {
  currentVersion: string;
  assetKey: 'satellite' | 'mission_control';
  displayHint: string;
}): Promise<void> => {
  const githubRelease = await githubJunoLastRelease();

  if (githubRelease === undefined) {
    console.log(`${red('Cannot fetch last release version of Juno on GitHub 😢.')}`);
    return;
  }

  const {assets} = githubRelease;

  const asset = assets?.find(({name}) => name.includes(assetKey));

  if (asset === undefined) {
    console.log(
      `${red(`No "${assetKey}" asset has been released with the version. Reach out Juno❗️`)}`
    );
    return;
  }

  // Extract - or guess - version number from released asset
  // e.g. Juno v0.5.0 is released with satellite-v0.2.0.wasm => extract version = 0.2.0
  // This because the wasm might not necessary changes across Juno's versions.
  const latestVersion = coerce(asset.name)?.format();

  if (!latestVersion) {
    console.log(`${red(`Cannot extract version from asset "${assetKey}". Reach out Juno❗️`)}`);
    return;
  }

  checkVersion({
    currentVersion,
    latestVersion,
    displayHint,
    commandLineHint: `juno upgrade${assetKey === 'mission_control' ? ' -m' : ''}`
  });
};

const checkVersion = ({
  currentVersion,
  latestVersion,
  displayHint,
  commandLineHint
}: {
  currentVersion: string;
  latestVersion: string;
  displayHint: string;
  commandLineHint: string;
}) => {
  const diff = compare(currentVersion, latestVersion);

  if (diff === 0) {
    console.log(`Your ${displayHint} (${green(`v${currentVersion}`)}) is up-to-date.`);
    return;
  }

  if (diff === 1) {
    console.log(
      `${yellow(`Your ${displayHint} version is more recent than the latest available 🤔.`)}`
    );
    return;
  }

  console.log(
    `Your ${displayHint} (${yellow(`v${currentVersion}`)}) is behind the latest version (${green(
      `v${latestVersion}`
    )}) available. Run ${cyan(commandLineHint)} to update it.`
  );
};
