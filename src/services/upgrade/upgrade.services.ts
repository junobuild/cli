import {
  checkUpgradeVersion,
  setCustomDomains,
  UpgradeCodeUnchangedError,
  type CustomDomain,
  type SatelliteParameters
} from '@junobuild/admin';
import {assertAnswerCtrlC, downloadFromURL, hasArgs} from '@junobuild/cli-tools';
import {isNullish} from '@junobuild/utils';
import {createHash} from 'crypto';
import {red, yellow} from 'kleur';
import {readFile} from 'node:fs/promises';
import ora from 'ora';
import prompts from 'prompts';
import {JUNO_CDN_URL} from '../../constants/constants';
import type {AssetKey} from '../../types/asset-key';
import type {UpgradeWasm} from '../../types/upgrade';
import {toAssetKeys} from '../../utils/asset-key.utils';
import {confirmAndExit} from '../../utils/prompt.utils';
import {newerReleases as newerReleasesUtils} from '../../utils/upgrade.utils';
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
    await assert?.({wasmModule: wasm});
    await assertUpgradeHash({hash, reset});
  }

  const spinner = ora(`Upgrading Wasm${reset ? ' and resetting state' : ''}...`).start();

  try {
    await upgrade({
      wasmModule: wasm
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
} & Pick<UpgradeWasm, 'reset' | 'upgrade' | 'assert' | 'nocheck'>): Promise<{
  success: boolean;
  err?: unknown;
}> => {
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

    return {success: true};
  } catch (err: unknown) {
    spinner.stop();

    return {success: false, err};
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
} & Pick<UpgradeWasm, 'reset' | 'upgrade' | 'assert' | 'nocheck'>): Promise<{
  success: boolean;
  err?: unknown;
}> => {
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

    return {success: true};
  } catch (err: unknown) {
    spinner.stop();

    return {success: false, err};
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

const promptReleases = async ({
  newerReleases,
  assetKey
}: {
  newerReleases: string[];
  assetKey: AssetKey;
}): Promise<string> => {
  const choices = newerReleases.map((release) => ({
    title: `v${release}`,
    value: release
  }));

  const {version}: {version: string} = await prompts({
    type: 'select',
    name: 'version',
    message: `To which version should your ${assetKey.replace('_', ' ')} be upgraded?`,
    choices,
    initial: 0
  });

  assertAnswerCtrlC(version);

  return version;
};

export const selectVersion = async ({
  currentVersion,
  assetKey,
  displayHint
}: {
  currentVersion: string;
  assetKey: AssetKey;
  displayHint: string;
}): Promise<string | undefined> => {
  const {result: newerReleases, error} = await newerReleasesUtils({
    currentVersion,
    assetKeys: toAssetKeys(assetKey)
  });

  if (error !== undefined) {
    console.log(`${red(error)}`);
    return undefined;
  }

  if (newerReleases === undefined) {
    console.log(`${red('Did not find any new releases of Juno 😢.')}`);
    return undefined;
  }

  if (newerReleases.length === 0) {
    console.log(`Currently, there are no new releases available.`);
    return undefined;
  }

  const selectedVersion = await promptReleases({
    newerReleases,
    assetKey
  });

  const {canUpgrade} = checkUpgradeVersion({currentVersion, selectedVersion});

  if (!canUpgrade) {
    console.log(
      `There may have been breaking changes between your ${displayHint} ${yellow(
        `v${currentVersion}`
      )} and selected version ${yellow(`v${selectedVersion}`)}.\nPlease upgrade iteratively.`
    );

    return undefined;
  }

  return selectedVersion;
};

export const confirmReset = async ({
  args,
  assetKey
}: {
  args?: string[];
  assetKey: AssetKey;
}): Promise<boolean> => {
  const reset = hasArgs({args, options: ['-r', '--reset']});

  if (!reset) {
    return false;
  }

  await confirmAndExit(
    `⚠️  Are you absolutely sure you want to upgrade and reset (❗️) your ${assetKey.replace(
      '_',
      ' '
    )} to its initial state?`
  );

  return true;
};

export const consoleUpgradeResult = ({
  success,
  err,
  successMessage
}: {
  successMessage: string;
  success: boolean;
  err?: unknown;
}) => {
  if (success) {
    console.log(`✅ ${successMessage}`);
    return;
  }

  if (isNullish(err)) {
    return;
  }

  if (err instanceof UpgradeCodeUnchangedError) {
    console.log(`🙅‍♂️ ${err.message}`);
    return;
  }

  throw err;
};
