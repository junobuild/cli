import type {EmulatorSatellite, EmulatorSkylab} from '@junobuild/config';

export const EMULATOR_PORT_SERVER = 5987;
export const EMULATOR_PORT_ADMIN = 5999;
export const EMULATOR_PORT_CONSOLE = 5866;

export const EMULATOR_SKYLAB: Required<EmulatorSkylab> = {
  ports: {
    server: EMULATOR_PORT_SERVER,
    admin: EMULATOR_PORT_ADMIN,
    console: EMULATOR_PORT_CONSOLE
  }
};

export const EMULATOR_SATELLITE: Required<EmulatorSatellite> = {
  ports: {
    server: EMULATOR_PORT_SERVER,
    admin: EMULATOR_PORT_ADMIN
  }
};
