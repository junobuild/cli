import {isNullish} from '@dfinity/utils';
import {deleteAssets} from '@junobuild/admin';
import {hasArgs, nextArg} from '@junobuild/cli-tools';
import {deleteAsset} from '@junobuild/core';
import {green, yellow, cyan} from 'kleur';
import ora from 'ora';
import {noJunoConfig} from '../../configs/juno.config';
import {assertConfigAndLoadSatelliteContext} from '../../utils/juno.config.utils';
import {consoleNoConfigFound} from '../../utils/msg.utils';

export const clearStorage = async (args?: string[]) => {
  if (await noJunoConfig()) {
    consoleNoConfigFound();
    return;
  }

  const {satellite, satelliteConfig} = await assertConfigAndLoadSatelliteContext();
  const deployMappings = satelliteConfig.deploy;

  if (isNullish(deployMappings) || deployMappings.length === 0) {
    console.log(yellow('No storage deploy mappings found in configuration.'));
    return;
  }

  if (hasArgs({args, options: ['-f', '--fullpath', '--fullPath']})) {
    const file =
      nextArg({args, option: '-f'}) ??
      nextArg({args, option: '--fullpath'}) ??
      nextArg({args, option: '--fullPath'});
    const collection = nextArg({args, option: '-c'}) ?? nextArg({args, option: '--collection'});

    if (isNullish(file) || isNullish(collection)) {
      console.log(
        `Provide both ${yellow('--collection')} and ${yellow('--fullPath')} to clear a specific file.`
      );
      return;
    }

    const spinner = ora(`Clearing ${file} from collection "${collection}"...`).start();

    try {
      await deleteAsset({
        collection,
        satellite,
        fullPath: cleanFullPath(file)
      });

      console.log(`${green('✔')} ${file} cleared from "${collection}".`);
    } finally {
      spinner.stop();
    }

    return;
  }

  // Clear all assets from all deploy collections
  for (const {collection} of deployMappings) {
    const spinner = ora(`Clearing collection "${collection}"...`).start();

    try {
      await deleteAssets({
        collection,
        satellite
      });

      spinner.stop();
      console.log(`${green('✔')} Collection ${cyan(`"${collection}"`)} cleared.`);
    } catch (err: unknown) {
      spinner.stop();
      throw err;
    }
  }

  console.log('');
  console.log(`${green('✔')} All storage collections cleared.`);
};

const cleanFullPath = (fullPath: string): string => {
  const path = fullPath.replace(/\\/g, '/');
  return `${path.startsWith('/') ? '' : '/'}${path}`;
};
