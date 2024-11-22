import type {InstallCodeParams} from '@dfinity/ic-management';

export type UpgradeWasmModule = Pick<InstallCodeParams, 'wasmModule'>;

export interface UpgradeWasm {
  wasm: Buffer;
  hash: string;
  upgrade: (params: UpgradeWasmModule) => Promise<void>;
  assert?: (params: UpgradeWasmModule) => Promise<void>;
  reset?: boolean;
  nocheck: boolean;
}
