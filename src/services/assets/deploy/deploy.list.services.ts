import {COLLECTION_DAPP} from '@junobuild/cli-tools';
import type {Asset} from '@junobuild/core';
import {listAssets as listAssetsLib} from '@junobuild/core';
import {DEPLOY_LIST_ASSETS_PAGINATION} from '../../../constants/deploy.constants';
import type {SatelliteParametersWithId} from '../../../types/satellite';

export const listAssets = async ({
  startAfter,
  satellite
}: {
  startAfter?: string;
  satellite: SatelliteParametersWithId;
}): Promise<Asset[]> => {
  const {assets, items_page, matches_pages} = await listAssetsLib({
    collection: COLLECTION_DAPP,
    satellite,
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
      satellite
    });
    return [...assets, ...nextAssets];
  }

  return assets;
};
