export interface UpgradeWasmModule {
  wasm_module: Uint8Array;
}

export interface UpgradeWasm {
  wasm: Buffer;
  hash: string;
  upgrade: (params: UpgradeWasmModule) => Promise<void>;
  assert?: (params: UpgradeWasmModule) => Promise<void>;
  reset?: boolean;
}
