import {satelliteBuildType, type BuildType, type SatelliteParameters} from '@junobuild/admin';
import {isNullish, nonNullish} from '@junobuild/utils';
import {yellow} from 'kleur';
import {type UpgradeWasmModule} from '../types/upgrade';
import {gunzipFile, isGzip} from '../utils/compress.utils';
import {confirmAndExit} from '../utils/prompt.utils';

const wasmBuildType = async ({wasm_module}: UpgradeWasmModule): Promise<BuildType | undefined> => {
  const buffer = Buffer.from(wasm_module);

  const wasm = isGzip(buffer)
    ? await gunzipFile({
        source: buffer
      })
    : buffer;

  const mod = new WebAssembly.Module(wasm);

  const metadata = WebAssembly.Module.customSections(mod, 'icp:public juno:build');

  const decoder = new TextDecoder();
  const buildType = decoder.decode(metadata[0]);

  return nonNullish(buildType) && ['stock', 'extended'].includes(buildType)
    ? (buildType as BuildType)
    : undefined;
};

export const assertSatelliteBuildType = async ({
  satellite,
  wasm_module
}: {satellite: SatelliteParameters} & UpgradeWasmModule) => {
  const [wasmType, satelliteType] = await Promise.all([
    wasmBuildType({wasm_module}),
    satelliteBuildType({
      satellite
    })
  ]);

  if (satelliteType === 'extended' && (wasmType === 'stock' || isNullish(wasmType))) {
    await confirmAndExit(
      `Your satellite is currently running on an ${yellow(
        `extended`
      )} build. However, you are about to upgrade it to the ${yellow(
        `stock`
      )} version. Are you sure you want to proceed?`
    );
  }
};
