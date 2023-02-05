import {access, readFile, writeFile} from 'fs/promises';
import {JUNO_CONFIG} from '../constants/constants';
import {JunoConfig} from '../types/juno.config';
import {SatelliteConfig} from '../types/satellite.config';

export const saveSatelliteConfig = async (satellite: SatelliteConfig): Promise<void> => {
  if (await junoConfigExist()) {
    const existingConfig = await readSatelliteConfig();
    await writeJunoConfig({
      ...existingConfig,
      satellite
    });
    return;
  }

  await writeJunoConfig({satellite});
};

const writeJunoConfig = (config: JunoConfig): Promise<void> =>
  writeFile(JUNO_CONFIG, JSON.stringify(config, null, 2), 'utf-8');

const readJunoConfig = async (): Promise<JunoConfig> => {
  const buffer = await readFile(JUNO_CONFIG);
  return JSON.parse(buffer.toString('utf-8'));
};

export const readSatelliteConfig = async (): Promise<SatelliteConfig> => {
  const {satellite} = await readJunoConfig();
  return satellite;
};

export const junoConfigExist = async (): Promise<boolean> => {
  try {
    await access(JUNO_CONFIG);
    return true;
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    } else {
      throw err;
    }
  }
};
