import {isNullish} from '@dfinity/utils';
import {deleteAsset} from '@junobuild/core';
import {cyan, green, yellow} from 'kleur';
import ora from 'ora';
import {existsSync, readdirSync} from 'node:fs';
import {join, relative} from 'node:path';
import {noJunoConfig} from '../../configs/juno.config';
import type {SatelliteParametersWithId} from '../../types/satellite';
import {assertConfigAndLoadSatelliteContext} from '../../utils/juno.config.utils';
import {consoleNoConfigFound} from '../../utils/msg.utils';
import {listAssetsForCollection} from './list.services';

export const pruneStorage = async (_args?: string[]) => {
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

  let totalPruned = 0;

  for (const mapping of deployMappings) {
    const pruned = await pruneCollection({mapping, satellite});
    totalPruned += pruned;
  }

  console.log('');
  if (totalPruned === 0) {
    console.log(`${green('✔')} No stale storage assets found. Nothing to prune.`);
  } else {
    console.log(`${green('✔')} Pruned ${totalPruned} stale storage asset${totalPruned > 1 ? 's' : ''}.`);
  }
};

const pruneCollection = async ({
  mapping: {source, collection},
  satellite
}: {
  mapping: {source: string; collection: string};
  satellite: SatelliteParametersWithId;
}): Promise<number> => {
  const spinner = ora(`Checking collection "${collection}" for stale storage assets...`).start();

  try {
    const remoteAssets = await listAssetsForCollection({satellite, collection});

    if (remoteAssets.length === 0) {
      spinner.stop();
      return 0;
    }

    const localPaths = new Set<string>();
    if (existsSync(source)) {
      collectLocalPaths(source, source, collection, localPaths);
    }

    const staleAssets = remoteAssets.filter((asset) => !localPaths.has(asset.fullPath));

    if (staleAssets.length === 0) {
      spinner.stop();
      return 0;
    }

    spinner.text = `Pruning ${staleAssets.length} stale storage asset${staleAssets.length > 1 ? 's' : ''} from "${collection}"...`;

    for (const asset of staleAssets) {
      await deleteAsset({
        satellite,
        collection,
        fullPath: asset.fullPath
      });
    }

    spinner.stop();
    console.log(
      `${green('✔')} Pruned ${staleAssets.length} storage asset${staleAssets.length > 1 ? 's' : ''} from ${cyan(`"${collection}"`)}.`
    );

    return staleAssets.length;
  } catch (err: unknown) {
    spinner.stop();
    throw err;
  }
};

/**
 * Recursively collect local file paths prefixed with /{collection}/ to match remote fullPaths.
 */
const collectLocalPaths = (dir: string, baseDir: string, collection: string, paths: Set<string>) => {
  const entries = readdirSync(dir, {withFileTypes: true});

  for (const entry of entries) {
    const fullFsPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectLocalPaths(fullFsPath, baseDir, collection, paths);
    } else {
      const relativePath = relative(baseDir, fullFsPath).replace(/\\/g, '/');
      paths.add(`/${collection}/${relativePath}`);
    }
  }
};

