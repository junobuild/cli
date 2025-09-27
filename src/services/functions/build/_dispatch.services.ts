import {red} from 'kleur';
import {readEmulatorConfig} from '../../../configs/emulator.config';
import {assertConfigAndReadSatelliteId} from '../../../utils/satellite.utils';
import {dispatchRequest} from '../../emulator/admin.services';

export const dispatchEmulatorUpgrade = async () => {
  const {satelliteId} = await assertConfigAndReadSatelliteId();

  await dispatchTouch({request: `satellite/upgrade?id=${satelliteId}`});
};

export const dispatchEmulatorBuild = async () => {
  await dispatchTouch({request: 'sputnik/build'});
};

/**
 * Workaround Podman and Apple container issues on macOS:
 * - https://github.com/containers/podman/issues/22343
 * - https://github.com/apple/container/issues/141
 */
const dispatchTouch = async ({request}: {request: string}) => {
  const parsedResult = await readEmulatorConfig();

  if (!parsedResult.success) {
    return;
  }

  const {result} = await dispatchRequest({
    config: parsedResult.config,
    request
  });

  // We silence the error (result === error). Maybe the emulator is not running on purpose.

  if (result === 'not_ok') {
    console.log(red(`Invalid response from the emulator. Request '${request}' did not succeed.`));
  }
};
