import {
  missionControlVersion as missionControlVersionLib,
  orbiterVersion as orbiterVersionLib,
  satelliteVersion as satelliteVersionLib
} from '@junobuild/admin';
import {isNullish} from '@junobuild/utils';
import {cyan, green, red, yellow} from 'kleur';
import {clean, compare} from 'semver';
import {version as cliCurrentVersion} from '../../package.json';
import {getCliMissionControl, getCliOrbiters} from '../configs/cli.config';
import {junoConfigExist, readJunoConfig} from '../configs/juno.config';
import {
  MISSION_CONTROL_WASM_NAME,
  ORBITER_WASM_NAME,
  SATELLITE_WASM_NAME
} from '../constants/constants';
import {githubCliLastRelease} from '../rest/github.rest';
import type {AssetKey} from '../types/asset-key';
import {actorParameters} from '../utils/actor.utils';
import {toAssetKeys} from '../utils/asset-key.utils';
import {configEnv} from '../utils/config.utils';
import {orbiterKey, satelliteKey, satelliteParameters} from '../utils/satellite.utils';
import {lastRelease} from '../utils/upgrade.utils';

export const version = async (args?: string[]) => {
  await cliVersion();
  await missionControlVersion();
  await satelliteVersion(args);
  await orbitersVersion();
};

const cliVersion = async () => {
  const githubRelease = await githubCliLastRelease();

  if (githubRelease === undefined) {
    console.log(`${red('Cannot fetch last release version of Juno on GitHub 😢.')}`);
    return;
  }

  const {tag_name} = githubRelease;

  const latestVersion = clean(tag_name);

  if (isNullish(latestVersion)) {
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
  const missionControl = getCliMissionControl();

  if (isNullish(missionControl)) {
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

const satelliteVersion = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    console.log(`No ${yellow('config')} file found.`);
    return;
  }

  const env = configEnv(args);
  const {satellite: satelliteConfig} = await readJunoConfig(env);

  const satellite = satelliteParameters({satellite: satelliteConfig, env});
  const {satelliteId} = satellite;

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

const orbitersVersion = async () => {
  const orbiters = getCliOrbiters();

  if (isNullish(orbiters) || orbiters.length === 0) {
    return;
  }

  const checkOrbiterVersion = async (orbiterId: string) => {
    const orbiterParameters = {
      orbiterId,
      ...actorParameters()
    };

    const currentVersion = await orbiterVersionLib({
      orbiter: orbiterParameters
    });

    const displayHint = `orbiter "${orbiterKey(orbiterId)}"`;

    await checkSegmentVersion({
      currentVersion,
      assetKey: ORBITER_WASM_NAME,
      displayHint
    });
  };

  await Promise.allSettled(
    orbiters.map(async ({p: orbiterId}) => {
      await checkOrbiterVersion(orbiterId);
    })
  );
};

const checkSegmentVersion = async ({
  currentVersion,
  assetKey,
  displayHint
}: {
  currentVersion: string;
  assetKey: AssetKey;
  displayHint: string;
}): Promise<void> => {
  const latestVersion = await lastRelease(toAssetKeys(assetKey));

  if (latestVersion === undefined) {
    console.log(`${red(`Cannot fetch last release version of ${displayHint} on Juno's CDN 😢.`)}`);
    return;
  }

  checkVersion({
    currentVersion,
    latestVersion,
    displayHint,
    commandLineHint: `juno upgrade${assetKey === 'mission_control' ? '-t -m' : ''}`
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
