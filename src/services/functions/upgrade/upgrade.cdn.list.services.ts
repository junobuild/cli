import {COLLECTION_CDN_RELEASES} from '@junobuild/cli-tools';
import {type Asset, listAssets} from '@junobuild/core';
import {DEPLOY_LIST_ASSETS_PAGINATION} from '../../../constants/deploy.constants';
import type {SatelliteParametersWithId} from '../../../types/satellite';
import {last} from '../../../utils/array.utils';

export const listCdnAssets = async ({
  startAfter,
  satellite,
  traverseAll = false
}: {
  startAfter?: string;
  satellite: SatelliteParametersWithId;
  traverseAll?: boolean;
}): Promise<Asset[]> => {
  const {items, items_length, matches_length} = await listAssets({
    collection: COLLECTION_CDN_RELEASES,
    satellite,
    filter: {
      order: {
        desc: true,
        field: 'created_at'
      },
      paginate: {
        startAfter,
        limit: DEPLOY_LIST_ASSETS_PAGINATION
      }
    }
  });

  if (items_length > matches_length && traverseAll) {
    const nextItems = await listCdnAssets({
      startAfter: last(items)?.fullPath,
      satellite,
      traverseAll
    });
    return [...items, ...nextItems];
  }

  return items;
};
