import {isNullish, nonNullish} from '@dfinity/utils';
import {type BuildType, findJunoPackageDependency} from '@junobuild/admin';
import {gunzipFile, isGzip} from '@junobuild/cli-tools';
import {JUNO_PACKAGE_SATELLITE_ID, type JunoPackage, JunoPackageSchema} from '@junobuild/config';
import {readFile} from 'node:fs/promises';
import {uint8ArrayToString} from 'uint8array-extras';

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

const extractBuildType = async ({
  junoPackage,
  wasm
}: {
  junoPackage: JunoPackage | undefined;
  wasm: Buffer;
}): Promise<BuildType | undefined> => {
  if (isNullish(junoPackage)) {
    return await readDeprecatedBuildType({wasm});
  }

  const {name, dependencies} = junoPackage;

  if (name === JUNO_PACKAGE_SATELLITE_ID) {
    return 'stock';
  }

  const satelliteDependency = findJunoPackageDependency({
    dependencies,
    dependencyId: JUNO_PACKAGE_SATELLITE_ID
  });

  return nonNullish(satelliteDependency) ? 'extended' : undefined;
};

/**
 * @deprecated Modern WASM build use JunoPackage.
 */
const readDeprecatedBuildType = async ({wasm}: {wasm: Buffer}): Promise<BuildType | undefined> => {
  const buildType = await customSection({wasm, sectionName: 'icp:public juno:build'});

  return nonNullish(buildType) && ['stock', 'extended'].includes(buildType)
    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      (buildType as BuildType)
    : undefined;
};

const readCustomSectionJunoPackage = async ({
  wasm
}: {
  wasm: Buffer;
}): Promise<JunoPackage | undefined> => {
  const section = await customSection({wasm, sectionName: 'icp:public juno:package'});

  if (isNullish(section)) {
    return undefined;
  }

  const {success, data} = JunoPackageSchema.safeParse(section);
  return success ? data : undefined;
};

const customSection = async ({
  sectionName,
  wasm
}: {
  sectionName: string;
  wasm: Buffer;
}): Promise<string | undefined> => {
  const wasmModule = await WebAssembly.compile(wasm);

  const pkgSections = WebAssembly.Module.customSections(wasmModule, sectionName);

  const [pkgBuffer] = pkgSections;

  return nonNullish(pkgBuffer) ? uint8ArrayToString(pkgBuffer) : undefined;
};
