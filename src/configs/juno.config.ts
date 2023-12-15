import {access, readFile, writeFile} from 'node:fs/promises';
import {JUNO_JSON} from '../constants/constants';
import type {JunoConfig, SatelliteConfig} from '../types/juno.config';

export const saveSatelliteConfig = async (satellite: SatelliteConfig): Promise<void> => {
  if (await junoConfigExist()) {
    const existingConfig = await readJunoConfig();
    await writeJunoConfig({
      ...existingConfig,
      satellite
    });
    return;
  }

  await writeJunoConfig({satellite});
};

export const readSatelliteConfig = async (): Promise<SatelliteConfig> => {
  const {satellite} = await readJunoConfig();
  return satellite;
};

export const junoConfigExist = async (): Promise<boolean> => {
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

const writeJunoConfig = async (config: JunoConfig): Promise<void> => {
  await writeFile(JUNO_JSON, JSON.stringify(config, null, 2), 'utf-8');
};

const readJunoConfig = async (): Promise<JunoConfig> => {
  const buffer = await readFile(JUNO_JSON);
  return JSON.parse(buffer.toString('utf-8'));
};
