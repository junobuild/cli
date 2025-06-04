import {nonNullish, toNullable} from '@dfinity/utils';
import type {Proposal, ProposalKey} from '@junobuild/cdn';
import type {SatelliteParametersWithId} from '../../../types/satellite';
import {listAssets} from '@junobuild/core';
import {DAPP_COLLECTION} from '../../../constants/constants';
import {DEPLOY_LIST_ASSETS_PAGINATION} from '../../../constants/deploy.constants';

const listCdnAssets = async ({
  startAfter,
  satellite,
  traverseAll
}: {
  startAfter?: bigint;
  satellite: SatelliteParametersWithId;
  traverseAll: boolean;
}): Promise<Array<[ProposalKey, Proposal]>> => {
  const {items, items_length, matches_length} = await listAssets({
    collection: DAPP_COLLECTION,
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

  if (items_length > matches_length && traverseAll) {
    const nextItems = await listProposals({
      startAfter: last(items)?.[0].proposal_id,
      satellite,
      traverseAll
    });
    return [...items, ...nextItems];
  }

  return items;
};
