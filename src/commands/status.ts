import {isNullish, nonNullish, notEmptyString} from '@dfinity/utils';
import {
  getJunoPackageVersion,
  missionControlVersion as missionControlVersionLib,
  orbiterVersion as orbiterVersionLib
} from '@junobuild/admin';
import {red, yellow} from 'kleur';
import {actorParameters} from '../api/actor.api';
import {getCliMissionControl, getCliOrbiters} from '../configs/cli.config';
import {
  MISSION_CONTROL_WASM_NAME,
  ORBITER_WASM_NAME,
  SATELLITE_WASM_NAME
} from '../constants/constants';
import {checkVersion, getSatelliteVersion} from '../services/version.services';
import type {AssetKey} from '../types/asset-key';
import {toAssetKeys} from '../utils/asset-key.utils';
import {orbiterKey, satelliteKey} from '../utils/cli.config.utils';
import {assertConfigAndLoadSatelliteContext} from '../utils/satellite.utils';
import {lastRelease} from '../utils/upgrade.utils';

export const status = async () => {
  await missionControlVersion();
  await satelliteVersion();
  await orbitersVersion();
};

const missionControlVersion = async () => {
  const missionControl = await getCliMissionControl();

  if (isNullish(missionControl)) {
    console.log(
      `${yellow(
        'No mission control found.'
      )} This is expected if your access key doesn't manage it.`
    );
    return;
  }

  const actorParams = await actorParameters();

  const getVersion = async (): Promise<string> => {
    const version = await getJunoPackageVersion({
      moduleId: missionControl,
      ...actorParams
    });

    if (nonNullish(version) && notEmptyString(version)) {
      return version;
    }

    // Legacy
    const missionControlParameters = {
      missionControlId: missionControl,
      ...actorParams
    };

    return await missionControlVersionLib({
      missionControl: missionControlParameters
    });
  };

  const currentVersion = await getVersion();

  const displayHint = `mission control`;

  await checkSegmentVersion({
    currentVersion,
    assetKey: MISSION_CONTROL_WASM_NAME,
    displayHint
  });
};

const satelliteVersion = async () => {
  const {satellite} = await assertConfigAndLoadSatelliteContext();
  const {satelliteId} = satellite;

  const displayHint = `satellite "${await satelliteKey(satelliteId)}"`;

  const result = await getSatelliteVersion();

  if (result.result === 'error') {
    return;
  }

  const {version: currentVersion} = result;

  await checkSegmentVersion({
    currentVersion,
    assetKey: SATELLITE_WASM_NAME,
    displayHint
  });
};

const orbitersVersion = async () => {
  const orbiters = await getCliOrbiters();

  if (isNullish(orbiters) || orbiters.length === 0) {
    return;
  }

  const checkOrbiterVersion = async (orbiterId: string) => {
    const actorParams = await actorParameters();

    const orbiterParameters = {
      orbiterId,
      ...actorParams
    };

    const getVersion = async (): Promise<string> => {
      const version = await getJunoPackageVersion({
        moduleId: orbiterId,
        ...actorParams
      });

      if (nonNullish(version) && notEmptyString(version)) {
        return version;
      }

      // Legacy
      return await orbiterVersionLib({
        orbiter: orbiterParameters
      });
    };

    const currentVersion = await getVersion();

    const displayHint = `orbiter "${await orbiterKey(orbiterId)}"`;

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
    console.log(red(`Cannot fetch last release version of ${displayHint} on Juno's CDN 😢.`));
    return;
  }

  checkVersion({
    currentVersion,
    latestVersion,
    displayHint,
    commandLineHint: `juno upgrade${assetKey === 'mission_control' ? '-t m' : ''}`
  });
};
