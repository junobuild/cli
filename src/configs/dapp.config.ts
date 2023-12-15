import {access, readFile, writeFile} from 'node:fs/promises';
import {JUNO_JSON} from '../constants/constants';
import {type JunoConfig} from '../types/juno.config';
import {type SatelliteConfig} from '../types/satellite.config';

export const saveSatelliteConfig = async (satellite: SatelliteConfig): Promise<void> => {
  if (await dappConfigExist()) {
    const existingConfig = await readDappConfig();
    await writeDappConfig({
      ...existingConfig,
      satellite
    });
    return;
  }

  await writeDappConfig({satellite});
};

export const readSatelliteConfig = async (): Promise<SatelliteConfig> => {
  const {satellite} = await readDappConfig();
  return satellite;
};

export const dappConfigExist = async (): Promise<boolean> => {
  try {
    await access(JUNO_JSON);
    return true;
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    } else {
      throw err;
    }
  }
};

const writeDappConfig = async (config: JunoConfig): Promise<void> => {
  await writeFile(JUNO_JSON, JSON.stringify(config, null, 2), 'utf-8');
};

const readDappConfig = async (): Promise<JunoConfig> => {
  const buffer = await readFile(JUNO_JSON);
  return JSON.parse(buffer.toString('utf-8'));
};
