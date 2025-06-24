import type {EmulatorSkylab} from '@junobuild/config';

export const EMULATOR_SKYLAB: Required<EmulatorSkylab> = {
  ports: {
    server: 5987,
    admin: 5999,
    console: 5866
  }
};
