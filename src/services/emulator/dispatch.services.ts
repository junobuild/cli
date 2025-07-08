import {red, yellow} from 'kleur';
import {readEmulatorConfig} from '../../configs/emulator.config';
import {EMULATOR_SKYLAB} from '../../constants/emulator.constants';
import {DEV} from '../../env';

export const dispatchEmulatorUpgrade = async () => {
  await dispatchSatelliteCommand({subCommand: 'upgrade'});
};

export const dispatchEmulatorConfig = async () => {
  await dispatchSatelliteCommand({subCommand: 'config'});
};

const dispatchSatelliteCommand = async ({subCommand}: {subCommand: 'upgrade' | 'config'}) => {
  if (!DEV) {
    return;
  }

  const parsedResult = await readEmulatorConfig();

  if (!parsedResult.success) {
    return;
  }

  const {
    config: {
      config,
      derivedConfig: {emulatorType}
    }
  } = parsedResult;

  const adminPort = config[emulatorType]?.ports?.admin ?? EMULATOR_SKYLAB.ports.admin;

  try {
    const response = await fetch(`http://localhost:${adminPort}/satellite/${subCommand}`);

    if (!response.ok) {
      console.log(
        red(`Invalid response from the emulator. The '${subCommand}' command did not succeed.`)
      );
    }
  } catch (error: unknown) {
    console.log(
      yellow(`The '${subCommand}' command failed. Maybe the emulator is not running? 🤔`)
    );
  }
};
