import {createHash} from 'crypto';
import {readFile} from 'fs/promises';
import {cyan} from 'kleur';
import ora from 'ora';
import {downloadFromURL} from './download.utils';
import {GitHubAsset} from './github.utils';
import {confirmAndExit, NEW_CMD_LINE} from './prompt.utils';

const executeUpgradeWasm = async ({
  upgrade,
  wasm,
  hash
}: {
  wasm: Buffer;
  hash: string;
  upgrade: ({wasm_module}: {wasm_module: Uint8Array}) => Promise<void>;
}) => {
  await confirmAndExit(`Wasm hash is ${cyan(hash)}.${NEW_CMD_LINE}Start upgrade now?`);

  const spinner = ora('Upgrading Wasm...').start();

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
  upgrade
}: {
  src: string;
  upgrade: ({wasm_module}: {wasm_module: Uint8Array}) => Promise<void>;
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

    await executeUpgradeWasm({upgrade, wasm, hash});
  } catch (err: unknown) {
    spinner.stop();
    throw err;
  }
};

export const upgradeWasmGitHub = async ({
  asset,
  upgrade
}: {
  asset: GitHubAsset;
  upgrade: ({wasm_module}: {wasm_module: Uint8Array}) => Promise<void>;
}) => {
  const downloadWasm = async ({
    browser_download_url
  }: GitHubAsset): Promise<{hash: string; wasm: Buffer}> => {
    const wasm = await downloadFromURL(browser_download_url);

    return {
      wasm,
      hash: createHash('sha256').update(wasm).digest('hex')
    };
  };

  const spinner = ora('Downloading Wasm...').start();

  try {
    const {hash, wasm} = await downloadWasm(asset);

    spinner.stop();

    await executeUpgradeWasm({upgrade, wasm, hash});
  } catch (err: unknown) {
    spinner.stop();
    throw err;
  }
};
