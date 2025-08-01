import {red} from 'kleur';
import {readEmulatorConfig} from '../../configs/emulator.config';
import {SATELLITE_WASM, SPUTNIK_INDEX_MJS} from '../../constants/dev.constants';
import {EMULATOR_SKYLAB} from '../../constants/emulator.constants';

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
      config,
      derivedConfig: {emulatorType, runner}
    }
  } = parsedResult;

  if (runner === 'docker') {
    // No need of the workaround for Docker
    return;
  }

  const adminPort = config[emulatorType]?.ports?.admin ?? EMULATOR_SKYLAB.ports.admin;

  try {
    const response = await fetch(
      `http://localhost:${adminPort}/admin/touch?file=${encodeURIComponent(filename)}`,
      {signal: AbortSignal.timeout(5000)}
    );

    if (!response.ok) {
      console.log(
        red(`Invalid response from the emulator. Touching '${filename}' did not succeed.`)
      );
    }
  } catch (_error: unknown) {
    // We silence the error. Maybe the emulator is not running on purpose.
  }
};
