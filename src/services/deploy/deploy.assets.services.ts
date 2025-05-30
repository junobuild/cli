import type {Asset} from '@junobuild/core';
import {listAssets as listAssetsLib} from '@junobuild/core';
import {DAPP_COLLECTION} from '../../constants/constants';
import {DEPLOY_LIST_ASSETS_PAGINATION} from '../../constants/deploy.constants';
import type {SatelliteConfigEnv} from '../../types/config';
import {satelliteParameters} from '../../utils/satellite.utils';

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
