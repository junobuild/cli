import {EMULATOR_SKYLAB} from '../../constants/emulator.constants';
import type {CliEmulatorConfig} from '../../types/emulator';

export const dispatchRequest = async ({
  config: emulatorConfig,
  adminRequest
}: {
  config: CliEmulatorConfig;
  adminRequest: string;
}): Promise<
  | {result: 'ok'; response: Response}
  | {result: 'not_ok'; response: Response}
  | {result: 'error'; err: unknown}
> => {
  const {
    config,
    derivedConfig: {emulatorType}
  } = emulatorConfig;

  const adminPort = config[emulatorType]?.ports?.admin ?? EMULATOR_SKYLAB.ports.admin;

  try {
    const response = await fetch(`http://localhost:${adminPort}/admin/${adminRequest}`, {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return {result: 'not_ok', response};
    }

    return {result: 'ok', response};
  } catch (err: unknown) {
    return {result: 'error', err};
  }
};
