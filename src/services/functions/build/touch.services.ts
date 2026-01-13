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
 * Workaround:
 *
 * 1. Podman and Apple container issues on macOS:
 * - https://github.com/containers/podman/issues/22343
 * - https://github.com/apple/container/issues/141
 *
 * 2. According to our debugging with developers, a similar issue arises with Docker on Windows.
 */
const dispatchTouch = async ({filename}: {filename: string}) => {
  if (!['darwin', 'win32'].includes(process.platform)) {
    // Workaround required on macOS with Podman and Windows with Docker.
    // Not sure if required on Intel-based Macs, but for simplicity we apply it to all macOS devices.
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

  // No need of the workaround for Docker on macOS
  if (process.platform === 'darwin' && runner === 'docker') {
    return;
  }

  // We did not test this use case therefore we assume it works (no reports so far)
  if (process.platform === 'win32' && runner === 'podman') {
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
