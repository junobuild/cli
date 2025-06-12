import {type BuildType, extractBuildType, readCustomSectionJunoPackage} from '@junobuild/admin';
import {gunzipFile, isGzip} from '@junobuild/cli-tools';
import type {JunoPackage} from '@junobuild/config';
import {readFile} from 'node:fs/promises';

interface WasmMetadata {
  gzipped: boolean;
  junoPackage: JunoPackage | undefined;
  buildType: BuildType | undefined;
}

export const readWasmFileMetadata = async ({path}: {path: string}): Promise<WasmMetadata> => {
  const buffer = await readFile(path);
  return await readWasmMetadata({buffer});
};

export const readWasmModuleMetadata = async ({
  wasmModule
}: {
  wasmModule: Uint8Array;
}): Promise<WasmMetadata> => {
  const buffer = Buffer.from(wasmModule);
  return await readWasmMetadata({buffer});
};

const readWasmMetadata = async ({buffer}: {buffer: Buffer}): Promise<WasmMetadata> => {
  const gzipped = isGzip(buffer);

  const wasm = gzipped
    ? await gunzipFile({
        source: buffer
      })
    : buffer;

  const junoPackage = await readCustomSectionJunoPackage({wasm});

  const buildType = await extractBuildType({wasm, junoPackage});

  return {
    gzipped,
    junoPackage,
    buildType
  };
};
