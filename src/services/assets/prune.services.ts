import {
  COLLECTION_DAPP,
  DEPLOY_DEFAULT_IGNORE,
  DEPLOY_DEFAULT_SOURCE,
  hasArgs,
  files as listFiles
} from '@junobuild/cli-tools';
import {deleteManyAssets, type Asset} from '@junobuild/core';
import {green, red, yellow} from 'kleur';
import {minimatch} from 'minimatch';
import {join} from 'node:path';
import ora from 'ora';
import {noJunoConfig} from '../../configs/juno.config';
import type {SatelliteParametersWithId} from '../../types/satellite';
import {assertConfigAndLoadSatelliteContext} from '../../utils/juno.config.utils';
import {consoleNoConfigFound} from '../../utils/msg.utils';
import {listAssets} from './_deploy/deploy.list.services';

/**
 * Converts an absolute file path to its fullPath form.
 * e.g. "/path/to/build/index.html" -> "/index.html"
 */
const toFullPath = ({
  file,
  sourceAbsolutePath
}: {
  file: string;
  sourceAbsolutePath: string;
}): string => file.replace(sourceAbsolutePath, '').replace(/\\/g, '/');

/**
 * Returns true if the file should be excluded based on the ignore patterns.
 */
const isIgnored = ({file, ignore}: {file: string; ignore: string[]}): boolean =>
  ignore.some((pattern) => minimatch(file, pattern, {matchBase: true}));

/**
 * Returns true if the file should be included for deletion.
 */
const shouldBeIncluded = (params: {file: string; ignore: string[]}): boolean => !isIgnored(params);

/**
 * Scans the local source directory and returns a Set of fullPaths that are present.
 * Throws if the directory cannot be read.
 */
const buildLocalPaths = ({
  sourceAbsolutePath,
  ignore
}: {
  sourceAbsolutePath: string;
  ignore: string[];
}): Set<string> => {
  const allFiles = listFiles(sourceAbsolutePath);
  const filteredFiles = allFiles.filter((file) => shouldBeIncluded({file, ignore}));
  return new Set(filteredFiles.map((file) => toFullPath({file, sourceAbsolutePath})));
};

export const prune = async (args?: string[]) => {
  if (await noJunoConfig()) {
    consoleNoConfigFound();
    return;
  }

  await executePrune(args);
};

const executePrune = async (args?: string[]) => {
  const dryRun = hasArgs({args, options: ['--dry-run']});

  const {satellite, satelliteConfig} = await assertConfigAndLoadSatelliteContext();

  const source = satelliteConfig.source ?? DEPLOY_DEFAULT_SOURCE;
  const ignore = satelliteConfig.ignore ?? DEPLOY_DEFAULT_IGNORE;

  const sourceAbsolutePath = join(process.cwd(), source);

  // 1. Scan local build output
  const localPathsResult = scanLocalFiles({sourceAbsolutePath, ignore});

  if (localPathsResult.status === 'error') {
    console.log(
      `${red('Cannot scan source directory.')} Is "${source}" built and configured in juno.config?`
    );
    return;
  }

  const {paths: localPaths} = localPathsResult;

  // 2. Fetch all live assets (paginated)
  const liveAssets = await fetchLiveAssets({satellite});

  // 3. Compute stale = live_assets − local_files
  const stale = liveAssets.filter(({fullPath}) => !localPaths.has(fullPath));

  if (stale.length === 0) {
    console.log(`${green('✔')} No stale assets found. Satellite is already clean.`);
    return;
  }

  // 4. Report
  console.log(`\nFound ${yellow(String(stale.length))} stale asset(s):`);
  for (const {fullPath} of stale) {
    console.log(`  ${yellow('−')} ${fullPath}`);
  }

  if (dryRun) {
    console.log(`\n${yellow('[dry-run]')} No files have been deleted.`);
    return;
  }

  // 5. Delete stale assets
  await pruneStaleAssets({stale, satellite});
};

const scanLocalFiles = ({
  sourceAbsolutePath,
  ignore
}: {
  sourceAbsolutePath: string;
  ignore: string[];
}): {status: 'success'; paths: Set<string>} | {status: 'error'; err: unknown} => {
  const scanSpinner = ora('Scanning local build output...').start();

  try {
    const paths = buildLocalPaths({sourceAbsolutePath, ignore});
    return {status: 'success', paths};
  } catch (err: unknown) {
    return {status: 'error', err};
  } finally {
    scanSpinner.stop();
  }
};

const fetchLiveAssets = async ({
  satellite
}: {
  satellite: SatelliteParametersWithId;
}): Promise<Asset[]> => {
  const fetchSpinner = ora('Fetching live assets from satellite...').start();

  try {
    return await listAssets({satellite});
  } finally {
    fetchSpinner.stop();
  }
};

const pruneStaleAssets = async ({
  stale,
  satellite
}: {
  stale: Asset[];
  satellite: Parameters<typeof listAssets>[0]['satellite'];
}): Promise<void> => {
  const deleteSpinner = ora(`Deleting ${stale.length} stale asset(s)...`).start();
  try {
    await deleteManyAssets({
      assets: stale.map(({fullPath}) => ({
        collection: COLLECTION_DAPP,
        fullPath
      })),
      satellite
    });
  } finally {
    deleteSpinner.stop();
  }

  console.log(`\n${green('✔')} Pruned ${stale.length} stale asset(s).`);
};
