import {satelliteMemorySize, satelliteVersion} from '@junobuild/admin';
import type {Asset} from '@junobuild/core';
import {listAssets as listAssetsLib} from '@junobuild/core';
import {yellow} from 'kleur';
import {compare} from 'semver';
import {readJunoConfig} from '../configs/juno.config';
import {DAPP_COLLECTION} from '../constants/constants';
import {
  DEPLOY_LIST_ASSETS_PAGINATION,
  MEMORY_HEAP_WARNING,
  MEMORY_SIZE_ENDPOINT_VERSION
} from '../constants/deploy.constants';
import type {SatelliteConfigEnv} from '../types/config';
import {configEnv} from '../utils/config.utils';
import {NEW_CMD_LINE, confirmAndExit} from '../utils/prompt.utils';
import {satelliteParameters} from '../utils/satellite.utils';

export const assertSatelliteMemorySize = async (args?: string[]) => {
  const env = configEnv(args);
  const {satellite: satelliteConfig} = await readJunoConfig(env);

  const {assertions} = satelliteConfig;

  if (assertions?.heapMemory === false) {
    return;
  }

  const satellite = await satelliteParameters({satellite: satelliteConfig, env});

  const currentVersion = await satelliteVersion({
    satellite
  });

  if (compare(currentVersion, MEMORY_SIZE_ENDPOINT_VERSION) < 0) {
    console.log(
      `Your satellite (${yellow(
        `v${currentVersion}`
      )}) is not up-to-date, and the memory size cannot be verified.${NEW_CMD_LINE}`
    );
    return;
  }

  const maxMemorySize =
    assertions?.heapMemory !== undefined && typeof assertions.heapMemory !== 'boolean'
      ? BigInt(assertions.heapMemory)
      : MEMORY_HEAP_WARNING;

  const {heap} = await satelliteMemorySize({satellite});

  if (heap < maxMemorySize) {
    return;
  }

  const formatNumber = (value: bigint): string =>
    Intl.NumberFormat('en-US', {
      maximumSignificantDigits: 3
    }).format(Number(value) / 1_000_000);

  await confirmAndExit(
    `⚠️  Your satellite's heap memory is ${formatNumber(
      heap
    )} MB, which exceeds the recommended limit of ${formatNumber(
      maxMemorySize
    )} MB. Are you sure you want to proceed with the deployment?`
  );
};

export const listAssets = async ({
  startAfter,
  env
}: {
  startAfter?: string;
  env: SatelliteConfigEnv;
}): Promise<Asset[]> => {
  const {assets, items_page, matches_pages} = await listAssetsLib({
    collection: DAPP_COLLECTION,
    satellite: await satelliteParameters(env),
    filter: {
      order: {
        desc: true,
        field: 'keys'
      },
      paginate: {
        startAfter,
        limit: DEPLOY_LIST_ASSETS_PAGINATION
      }
    }
  });

  const last = <T>(elements: T[]): T | undefined => {
    const {length, [length - 1]: last} = elements;
    return last;
  };

  if ((items_page ?? 0n) < (matches_pages ?? 0n)) {
    const nextAssets = await listAssets({
      startAfter: last(assets)?.fullPath,
      env
    });
    return [...assets, ...nextAssets];
  }

  return assets;
};
