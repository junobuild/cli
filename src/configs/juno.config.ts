import {access, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {JUNO_JSON} from '../constants/constants';
import type {JunoConfig, OrbiterConfig, SatelliteConfig} from '../types/juno.config';
import {nodeRequire} from './node.utils';

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

export const saveOrbiterConfig = async (orbiter: OrbiterConfig): Promise<void> => {
  if (!(await junoConfigExist())) {
    throw new Error(`No juno.json configuration file has been initialized yet.`);
  }

  const existingConfig = await readJunoConfig();
  await writeJunoConfig({
    ...existingConfig,
    orbiter
  });
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
  // const url = join(process.cwd(), 'juno.js');
  // console.log('------------>', (await import(url)).default);

  const urlTs = join(process.cwd(), 'juno.ts');

  const result = nodeRequire(urlTs);

  console.log('Export ------------->', result.module.default);

  //
  // console.log("Export", result.module.default);

  // const source = "let x: string  = 'string'";
  //
  // let result = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS }});
  //
  // console.log(JSON.stringify(result));

  const buffer = await readFile(JUNO_JSON);
  return JSON.parse(buffer.toString('utf-8'));
};
