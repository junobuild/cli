import {createHash} from 'crypto';
import {cyan} from 'kleur';
import ora from 'ora';
import {downloadFromURL} from './download.utils';
import {GitHubAsset} from './github.utils';
import {confirmAndExit, NEW_CMD_LINE} from './prompt.utils';

const executeUpgradeWasm = async ({
  upgrade,
  wasm
}: {
  wasm: Buffer;
  upgrade: ({wasm_module}: {wasm_module: Array<number>}) => Promise<void>;
}) => {
  const spinner = ora('Upgrading Wasm...').start();

  try {
    await upgrade({
      wasm_module: [...wasm]
    });
  } finally {
    spinner.stop();
  }
};

export const upgradeWasm = async ({
  asset,
  upgrade
}: {
  asset: GitHubAsset;
  upgrade: ({wasm_module}: {wasm_module: Array<number>}) => Promise<void>;
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

    await confirmAndExit(`Wasm hash is ${cyan(hash)}.${NEW_CMD_LINE}Start upgrade now?`);

    await executeUpgradeWasm({upgrade, wasm});
  } catch (err: unknown) {
    spinner.stop();
    throw err;
  }
};
