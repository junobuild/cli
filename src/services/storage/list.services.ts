import {listAssets as listAssetsLib} from '@junobuild/core';
import type {Asset} from '@junobuild/core';
import {DEPLOY_LIST_ASSETS_PAGINATION} from '../../constants/deploy.constants';
import type {SatelliteParametersWithId} from '../../types/satellite';
import {last} from '../../utils/array.utils';

export const listAssetsForCollection = async ({
  startAfter,
  satellite,
  collection
}: {
  startAfter?: string;
  satellite: SatelliteParametersWithId;
  collection: string;
}): Promise<Asset[]> => {
  const {items, items_page, matches_pages} = await listAssetsLib({
    collection,
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

  if ((items_page ?? 0n) < (matches_pages ?? 0n)) {
    const nextItems = await listAssetsForCollection({
      startAfter: last(items)?.fullPath,
      satellite,
      collection
    });
    return [...items, ...nextItems];
  }

  return items;
};
