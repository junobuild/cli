import {
  COLLECTION_DAPP,
  hasArgs,
  prune as pruneServices,
  type PruneFilesFn,
  type PruneFileStorage
} from '@junobuild/cli-tools';
import {deleteManyAssets, type Asset} from '@junobuild/core';
import {red, yellow} from 'kleur';
import {lstatSync} from 'node:fs';
import {noJunoConfig} from '../../configs/juno.config';
import type {SatelliteParametersWithId} from '../../types/satellite';
import {assertConfigAndLoadSatelliteContext} from '../../utils/juno.config.utils';
import {consoleNoConfigFound} from '../../utils/msg.utils';
import {parseBatchSize} from './_args.services';
import {listAssets} from './_assets.list.services';

export const prune = async (args?: string[]) => {
  if (await noJunoConfig()) {
    consoleNoConfigFound();
    return;
  }

  const dryRun = hasArgs({args, options: ['--dry-run']});
  const {value: pruneBatchSize} = parseBatchSize(args);

  await executePrune({dryRun, batchSize: pruneBatchSize});
};

export const executePrune = async (params: {dryRun?: boolean; batchSize?: number}) => {
  const {satellite, satelliteConfig} = await assertConfigAndLoadSatelliteContext();

  const listExistingAssets = async ({startAfter}: {startAfter?: string}): Promise<Asset[]> =>
    await listAssets({
      startAfter,
      satellite
    });

  const pruneFn: PruneFilesFn = async (params) => {
    await pruneStaleAssets({satellite, ...params});
  };

  const result = await pruneServices({
    params: {
      config: satelliteConfig,
      listAssets: listExistingAssets,
      assertSourceDirExists,
      ...params
    },
    pruneFn
  });

  if (result.result === 'simulated') {
    console.log(`\n${yellow('[dry-run]')} No files have been deleted.`);
  }
};

const pruneStaleAssets = async ({
  files,
  satellite
}: {
  files: PruneFileStorage[];
  satellite: SatelliteParametersWithId;
}): Promise<void> => {
  await deleteManyAssets({
    assets: files.map(({fullPath}) => ({
      collection: COLLECTION_DAPP,
      fullPath
    })),
    satellite
  });
};

const assertSourceDirExists = (source: string) => {
  try {
    lstatSync(source);
  } catch (_err: unknown) {
    console.log(
      `${red('Cannot scan source directory.')} Is "${source}" built and configured in juno.config?`
    );
    process.exit(1);
  }
};
