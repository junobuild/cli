import {isNullish} from '@dfinity/utils';
import {deleteAssets, listCustomDomains, setCustomDomains} from '@junobuild/admin';
import {COLLECTION_DAPP, hasArgs, nextArg} from '@junobuild/cli-tools';
import {deleteAsset} from '@junobuild/core';
import {green, yellow} from 'kleur';
import ora from 'ora';
import {noJunoConfig} from '../../configs/juno.config';
import {assertConfigAndLoadSatelliteContext} from '../../utils/juno.config.utils';
import {consoleNoConfigFound} from '../../utils/msg.utils';

export const clear = async (args?: string[]) => {
  if (await noJunoConfig()) {
    consoleNoConfigFound();
    return;
  }

  if (hasArgs({args, options: ['-f', '--fullpath', '--fullPath']})) {
    const file =
      nextArg({args, option: '-f'}) ??
      nextArg({args, option: '--fullpath'}) ??
      nextArg({args, option: '--fullPath'});

    if (isNullish(file)) {
      console.log(`You did not provide a ${yellow('fullPath')} to delete.`);
      return;
    }

    await clearAsset({fullPath: file});
    return;
  }

  await executeClear();
};

export const executeClear = async () => {
  const {satellite} = await assertConfigAndLoadSatelliteContext();

  const spinner = ora('Clearing app assets...').start();

  try {
    // TODO: to be removed. Workaround as temporary solution of https://github.com/junobuild/juno/issues/484.
    const domains = await listCustomDomains({satellite});

    await deleteAssets({
      collection: COLLECTION_DAPP,
      satellite
    });

    await setCustomDomains({
      satellite,
      domains
    });

    spinner.stop();

    console.log(`${green('✔')} App assets cleared.`);
    console.log('');
  } catch (err: unknown) {
    spinner.stop();
    throw err;
  }
};

const cleanFullPath = (fullPath: string): string => {
  const path = fullPath.replace(/\\/g, '/');
  return `${path.startsWith('/') ? '' : '/'}${path}`;
};

export const clearAsset = async ({fullPath}: {fullPath: string}) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext();

  const spinner = ora(`Clearing ${fullPath}...`).start();

  try {
    await deleteAsset({
      collection: COLLECTION_DAPP,
      satellite,
      fullPath: cleanFullPath(fullPath)
    });

    console.log(`${green('✔')} ${fullPath} cleared.`);
  } finally {
    spinner.stop();
  }
};
