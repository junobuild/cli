import {red} from 'kleur';
import {readEmulatorConfig} from '../../../configs/emulator.config';
import {SATELLITE_WASM, SPUTNIK_INDEX_MJS} from '../../../constants/dev.constants';
import {dispatchRequest} from '../../emulator/admin.services';

export const dispatchEmulatorTouchSatellite = async () => {
  await dispatchTouch({filename: `${SATELLITE_WASM}.gz`});
};

export const dispatchEmulatorTouchSputnik = async () => {
  await dispatchTouch({filename: SPUTNIK_INDEX_MJS});
};

/**
 * Workaround Podman and Apple container issues on macOS:
 * - https://github.com/containers/podman/issues/22343
 * - https://github.com/apple/container/issues/141
 */
const dispatchTouch = async ({filename}: {filename: string}) => {
  if (process.platform !== 'darwin') {
    // Workaround only required on macOS. Not sure if it's required on old Intel process, maybe not but
    // for simplicity reasons let's consider all Apple devices require the workaround.
    return;
  }

  const parsedResult = await readEmulatorConfig();

  if (!parsedResult.success) {
    return;
  }

  const {
    config: {
      derivedConfig: {runner}
    }
  } = parsedResult;

  if (runner === 'docker') {
    // No need of the workaround for Docker
    return;
  }

  const {result} = await dispatchRequest({
    config: parsedResult.config,
    request: `admin/touch?file=${encodeURIComponent(filename)}`
  });

  // We silence the error (result === error). Maybe the emulator is not running on purpose.

  if (result === 'not_ok') {
    console.log(red(`Invalid response from the emulator. Touching '${filename}' did not succeed.`));
  }
};
