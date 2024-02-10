import {setCustomDomains, type CustomDomain, type SatelliteParameters} from '@junobuild/admin';
import {createHash} from 'crypto';
import {readFile} from 'node:fs/promises';
import ora from 'ora';
import {JUNO_CDN_URL} from '../constants/constants';
import type {AssetKey} from '../types/asset-key';
import type {UpgradeWasm} from '../types/upgrade';
import {downloadFromURL} from '../utils/download.utils';
import {assertUpgradeHash} from './upgrade-assert.services';

const executeUpgradeWasm = async ({
  upgrade,
  wasm,
  hash,
  assert,
  reset = false,
  nocheck
}: UpgradeWasm) => {
  if (!nocheck) {
    await assert?.({wasm_module: wasm});
    await assertUpgradeHash({hash, reset});
  }

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
  reset,
  assert,
  nocheck
}: {
  src: string;
} & Pick<UpgradeWasm, 'reset' | 'upgrade' | 'assert' | 'nocheck'>) => {
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

    await executeUpgradeWasm({upgrade, wasm, hash, reset, assert, nocheck});
  } catch (err: unknown) {
    spinner.stop();
    throw err;
  }
};

export const upgradeWasmCdn = async ({
  version,
  assetKey,
  upgrade,
  assert,
  reset,
  nocheck
}: {
  version: string;
  assetKey: AssetKey;
} & Pick<UpgradeWasm, 'reset' | 'upgrade' | 'assert' | 'nocheck'>) => {
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

    await executeUpgradeWasm({upgrade, wasm, hash, reset, assert, nocheck});
  } catch (err: unknown) {
    spinner.stop();
    throw err;
  }
};

export const redoCustomDomains = async (params: {
  satellite: SatelliteParameters;
  domains: CustomDomain[];
}) => {
  const spinner = ora('Setting back custom domains...').start();

  try {
    await setCustomDomains(params);
  } finally {
    spinner.stop();
  }
};
