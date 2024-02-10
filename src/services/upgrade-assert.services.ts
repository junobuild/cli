import {satelliteBuildType, type BuildType, type SatelliteParameters} from '@junobuild/admin';
import {isNullish, nonNullish} from '@junobuild/utils';
import {cyan, yellow} from 'kleur';
import {type UpgradeWasm, type UpgradeWasmModule} from '../types/upgrade';
import {gunzipFile, isGzip} from '../utils/compress.utils';
import {NEW_CMD_LINE, confirmAndExit} from '../utils/prompt.utils';

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
  // TODO: Workaround for agent-js. Disable console.warn.
  // See https://github.com/dfinity/agent-js/issues/843
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const hideAgentJsConsoleWarn = globalThis.console.warn;
  globalThis.console.warn = (): null => null;

  const [wasmTypeResult, satelliteTypeResult] = await Promise.allSettled([
    wasmBuildType({wasm_module}),
    satelliteBuildType({
      satellite
    })
  ]);

  // Redo console.warn
  globalThis.console.warn = hideAgentJsConsoleWarn;

  if (wasmTypeResult.status === 'rejected') {
    throw new Error(`The custom sections of the WASM module you try to upgrade cannot be read.`);
  }

  // Agent-js throw an exception when a metadata path cannot be found therefore we assumed here that this happens because the Satellite version is < 0.0.15.
  if (satelliteTypeResult.status === 'rejected') {
    return;
  }

  const {value: wasmType} = wasmTypeResult;
  const {value: satelliteType} = satelliteTypeResult;

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

export const assertSatelliteHash = async ({hash, reset}: Pick<UpgradeWasm, 'hash' | 'reset'>) => {
  await confirmAndExit(
    `Wasm hash is ${cyan(hash)}.${NEW_CMD_LINE}Start upgrade${reset ? ' and reset' : ''} now?`
  );
};
