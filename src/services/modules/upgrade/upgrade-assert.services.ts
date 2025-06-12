import {isNullish} from '@dfinity/utils';
import {satelliteBuildType, type SatelliteParameters} from '@junobuild/admin';
import {cyan, yellow} from 'kleur';
import type {AssertWasmModule, UpgradeWasm} from '../../../types/upgrade';
import {isHeadless} from '../../../utils/process.utils';
import {NEW_CMD_LINE, confirmAndExit} from '../../../utils/prompt.utils';
import {readWasmModuleMetadata} from '../../../utils/wasm.utils';

export const assertSatelliteBuildType = async ({
  satellite,
  wasmModule
}: {satellite: SatelliteParameters} & AssertWasmModule) => {
  // TODO: Workaround for agent-js. Disable console.warn.
  // See https://github.com/dfinity/agent-js/issues/843
  const hideAgentJsConsoleWarn = globalThis.console.warn;
  globalThis.console.warn = (): null => null;

  const [wasmMetadataResult, satelliteTypeResult] = await Promise.allSettled([
    readWasmModuleMetadata({wasmModule}),
    satelliteBuildType({
      satellite
    })
  ]);

  // Redo console.warn
  globalThis.console.warn = hideAgentJsConsoleWarn;

  if (wasmMetadataResult.status === 'rejected') {
    throw new Error('The custom sections of the WASM module you try to upgrade cannot be read.');
  }

  // Agent-js throw an exception when a metadata path cannot be found therefore we assumed here that this happens because the Satellite version is < 0.0.15.
  if (satelliteTypeResult.status === 'rejected') {
    return;
  }

  const {value: wasmMetadata} = wasmMetadataResult;
  const {value: satelliteType} = satelliteTypeResult;

  const {buildType: wasmType} = wasmMetadata;

  const warning = satelliteType === 'extended' && (wasmType === 'stock' || isNullish(wasmType));

  if (isHeadless() && warning) {
    throw new Error(
      'Your satellite uses serverless functions. Reverting to the stock version would remove your custom features! '
    );
  }

  if (warning) {
    await confirmAndExit(
      `Your satellite uses ${cyan(
        `serverless functions`
      )}.${NEW_CMD_LINE}However, you are about to revert it to the ${yellow(
        `stock`
      )} version which will remove your custom features!${NEW_CMD_LINE}Are you sure you want to proceed?`
    );
  }
};

export const assertUpgradeHash = async ({
  hash,
  reset
}: Required<Pick<UpgradeWasm, 'hash' | 'reset'>>) => {
  await confirmAndExit(
    `The Wasm hash for the upgrade is ${cyan(hash)}.${NEW_CMD_LINE}Start upgrade${reset ? ' and reset' : ''} now?`
  );
};
