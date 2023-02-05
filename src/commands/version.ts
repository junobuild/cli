import {
  missionControlVersion as missionControlVersionLib,
  satelliteVersion as satelliteVersionLib,
  upgradeMissionControl,
  upgradeSatellite
} from '@junobuild/admin';
import {cyan, red, yellow} from 'kleur';
import {coerce, compare, major, minor} from 'semver';
import {MISSION_CONTROL_WASM_NAME, SATELLITE_WASM_NAME} from '../constants/constants';
import {actorParameters} from '../utils/actor.utils';
import {getMissionControl} from '../utils/auth.config.utils';
import {GitHubAsset, githubLastRelease} from '../utils/github.utils';
import {confirm, NEW_CMD_LINE} from '../utils/prompt.utils';
import {junoConfigExist, readSatelliteConfig} from '../utils/satellite.config.utils';
import {satelliteKey, satelliteParameters} from '../utils/satellite.utils';
import {upgradeWasm} from '../utils/wasm.utils';

export const version = async () => {
  await missionControlVersion();
  await satelliteVersion();
};

const missionControlVersion = async () => {
  const missionControl = getMissionControl();

  if (!missionControl) {
    console.log(`${red('No mission control found.')}`);
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

  const {upgrade, asset} = await shouldUpgradeVersion({
    currentVersion,
    assetKey: MISSION_CONTROL_WASM_NAME,
    displayHint
  });

  if (!upgrade) {
    return;
  }

  if (!asset) {
    throw new Error('No asset to continue with upgrade.');
  }

  const upgradeMissionControlWasm = async ({wasm_module}: {wasm_module: Array<number>}) =>
    upgradeMissionControl({
      missionControl: missionControlParameters,
      wasm_module
    });

  await upgradeWasm({asset, upgrade: upgradeMissionControlWasm});
};

const satelliteVersion = async () => {
  if (!(await junoConfigExist())) {
    console.log(`${red('No satellite configuration found.')}`);
    return;
  }

  const {satelliteId} = await readSatelliteConfig();

  const satellite = satelliteParameters(satelliteId);

  const currentVersion = await satelliteVersionLib({
    satellite
  });

  const displayHint = `satellite ${satelliteKey(satelliteId)}`;

  const {upgrade, asset} = await shouldUpgradeVersion({
    currentVersion,
    assetKey: SATELLITE_WASM_NAME,
    displayHint
  });

  if (!upgrade) {
    return;
  }

  if (!asset) {
    throw new Error('No asset to continue with upgrade.');
  }

  const upgradeSatelliteWasm = async ({wasm_module}: {wasm_module: Array<number>}) =>
    upgradeSatellite({
      satellite,
      wasm_module
    });

  await upgradeWasm({asset, upgrade: upgradeSatelliteWasm});
};

const shouldUpgradeVersion = async ({
  currentVersion,
  assetKey,
  displayHint
}: {
  currentVersion: string;
  assetKey: 'satellite' | 'mission_control';
  displayHint: string;
}): Promise<{upgrade: boolean; asset?: GitHubAsset}> => {
  const githubRelease = await githubLastRelease();

  if (githubRelease === undefined) {
    console.log(`${red('Cannot fetch GitHub repo last release version 😢.')}`);
    return {upgrade: false};
  }

  const {assets} = githubRelease;

  const asset = assets?.find(({name}) => name.includes(assetKey));

  if (asset === undefined) {
    console.log(
      `${red(`No "${assetKey}" asset has been released with the version. Reach out Juno❗️`)}`
    );
    return {upgrade: false};
  }

  // Extract - or guess - version number from released asset
  // e.g. Juno v0.5.0 is released with satellite-v0.2.0.wasm => extract version = 0.2.0
  // This because the wasm might not necessary changes across Juno's versions.
  const latestVersion = coerce(asset.name)?.format();

  if (!latestVersion) {
    console.log(`${red(`Cannot extract version from asset "${assetKey}". Reach out Juno❗️`)}`);
    return {upgrade: false};
  }

  const diff = compare(currentVersion, latestVersion);

  if (diff === 0) {
    return {upgrade: false};
  }

  if (diff === 1) {
    console.log(
      `${yellow(`'Your ${displayHint} version is more recent than the latest available 🤔.'`)}`
    );
    return {upgrade: false};
  }

  const answer = await confirm(
    `A new version ${latestVersion} for your ${cyan(
      displayHint
    )} is available.${NEW_CMD_LINE}Do you want to ${cyan('upgrade')} now?`
  );

  if (!answer) {
    return {upgrade: false};
  }

  // Check breaking changes
  const currentMajor = major(currentVersion);
  const latestMajor = major(latestVersion);
  const currentMinor = minor(currentVersion);
  const latestMinor = minor(latestVersion);

  if (currentMajor < latestMajor - 1 || currentMinor < latestMinor - 1) {
    console.log(
      `${yellow(
        `There may have been breaking changes between your ${displayHint} version ${cyan(
          `v${currentVersion}`
        )} and latest available ${cyan(latestVersion)}.\nPlease upgrade iteratively manually.`
      )}`
    );
    return {upgrade: false};
  }

  return {upgrade: true, asset};
};
