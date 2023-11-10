import {createHash} from 'crypto';
import {cyan} from 'kleur';
import {readFile} from 'node:fs/promises';
import ora from 'ora';
import {JUNO_CDN_URL} from '../constants/constants';
import type {AssetKey} from '../types/asset-key';
import {downloadFromURL} from '../utils/download.utils';
import {NEW_CMD_LINE, confirmAndExit} from '../utils/prompt.utils';

const executeUpgradeWasm = async ({
  upgrade,
  wasm,
  hash,
  reset = false
}: {
  wasm: Buffer;
  hash: string;
  upgrade: ({wasm_module}: {wasm_module: Uint8Array}) => Promise<void>;
  reset?: boolean;
}) => {
  await confirmAndExit(
    `Wasm hash is ${cyan(hash)}.${NEW_CMD_LINE}Start upgrade${reset ? ' and reset' : ''} now?`
  );

  const spinner = ora(`Upgrading Wasm${reset ? ' and resetting state' : ''}...`).start();

  try {
    await upgrade({
      wasm_module: wasm
    });
  } finally {
    spinner.stop();
  }
};

export const upgradeWasmLocal = async ({
  src,
  upgrade,
  reset
}: {
  src: string;
  upgrade: ({wasm_module}: {wasm_module: Uint8Array}) => Promise<void>;
  reset?: boolean;
}) => {
  const loadWasm = async (file: string): Promise<{hash: string; wasm: Buffer}> => {
    const wasm = await readFile(file);

    return {
      wasm,
      hash: createHash('sha256').update(wasm).digest('hex')
    };
  };

  const spinner = ora('Loading Wasm...').start();

  try {
    const {hash, wasm} = await loadWasm(src);

    spinner.stop();

    await executeUpgradeWasm({upgrade, wasm, hash, reset});
  } catch (err: unknown) {
    spinner.stop();
    throw err;
  }
};

export const upgradeWasmCdn = async ({
  version,
  assetKey,
  upgrade,
  reset
}: {
  version: string;
  assetKey: AssetKey;
  upgrade: ({wasm_module}: {wasm_module: Uint8Array}) => Promise<void>;
  reset?: boolean;
}) => {
  const downloadWasm = async (): Promise<{hash: string; wasm: Buffer}> => {
    const {hostname} = new URL(JUNO_CDN_URL);

    const wasm = await downloadFromURL({
      hostname,
      path: `/releases/${assetKey}-v${version}.wasm.gz`,
      headers: {
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });

    return {
      wasm,
      hash: createHash('sha256').update(wasm).digest('hex')
    };
  };

  const spinner = ora('Downloading Wasm...').start();

  try {
    const {hash, wasm} = await downloadWasm();

    spinner.stop();

    await executeUpgradeWasm({upgrade, wasm, hash, reset});
  } catch (err: unknown) {
    spinner.stop();
    throw err;
  }
};
