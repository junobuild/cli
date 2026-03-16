import {readEmulatorConfig} from '../../configs/emulator.config';

export const findEmulatorVersion = async () => {
  const parsedResult = await readEmulatorConfig();

  if (!parsedResult.success) {
    return {diff: 'error'};
  }

  const {config} = parsedResult;
}