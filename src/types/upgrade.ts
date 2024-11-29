import type {UpgradeCodeParams} from '@junobuild/admin';

export type UpgradeWasmModule = Pick<UpgradeCodeParams, 'wasmModule'> &
  Required<Pick<UpgradeCodeParams, 'onProgress'>>;

export type AssertWasmModule = Pick<UpgradeCodeParams, 'wasmModule'>;

export interface UpgradeWasm {
  wasm: Buffer;
  hash: string;
  upgrade: (params: UpgradeWasmModule) => Promise<void>;
  assert?: (params: AssertWasmModule) => Promise<void>;
  reset?: boolean;
}
