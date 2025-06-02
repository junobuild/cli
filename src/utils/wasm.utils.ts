import {gunzipFile, isGzip} from '@junobuild/cli-tools';
import type {JunoPackage} from '@junobuild/config';
import {readFile} from 'node:fs/promises';
import {uint8ArrayToString} from 'uint8array-extras';

export const readCustomSectionJunoPackage = async ({
  path
}: {
  path: string;
}): Promise<JunoPackage> => {
  const section = await customSection({path, sectionName: 'icp:public juno:package'});
  return JSON.parse(section);
};

const customSection = async ({
  path,
  sectionName
}: {
  path: string;
  sectionName: string;
}): Promise<string> => {
  const buffer = await readFile(path);

  const wasm = isGzip(buffer)
    ? await gunzipFile({
        source: buffer
      })
    : buffer;

  const wasmModule = await WebAssembly.compile(wasm);

  const pkgSections = WebAssembly.Module.customSections(wasmModule, sectionName);

  const [pkgBuffer] = pkgSections;
  return uint8ArrayToString(pkgBuffer);
};
