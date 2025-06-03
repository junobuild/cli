import {isNullish, nonNullish} from '@dfinity/utils';
import {gunzipFile, isGzip} from '@junobuild/cli-tools';
import type {JunoPackage} from '@junobuild/config';
import {readFile} from 'node:fs/promises';
import {uint8ArrayToString} from 'uint8array-extras';

export const readWasmMetadata = async ({
  path
}: {
  path: string;
}): Promise<{
  gzipped: boolean;
  junoPackage: JunoPackage | undefined;
}> => {
  const buffer = await readFile(path);

  const gzipped = isGzip(buffer);

  const wasm = gzipped
    ? await gunzipFile({
        source: buffer
      })
    : buffer;

  const junoPackage = await readCustomSectionJunoPackage({wasm});

  return {
    gzipped,
    junoPackage
  };
};

const readCustomSectionJunoPackage = async ({
  wasm
}: {
  wasm: Buffer<ArrayBufferLike>;
}): Promise<JunoPackage | undefined> => {
  const section = await customSection({wasm, sectionName: 'icp:public juno:package'});

  if (isNullish(section)) {
    return undefined;
  }

  return JSON.parse(section);
};

const customSection = async ({
  sectionName,
  wasm
}: {
  sectionName: string;
  wasm: Buffer<ArrayBufferLike>;
}): Promise<string | undefined> => {
  const wasmModule = await WebAssembly.compile(wasm);

  const pkgSections = WebAssembly.Module.customSections(wasmModule, sectionName);

  const [pkgBuffer] = pkgSections;

  return nonNullish(pkgBuffer) ? uint8ArrayToString(pkgBuffer) : undefined;
};
