import {fromNullable, nonNullish, toNullable, uint8ArrayToHexString} from '@dfinity/utils';
import {listProposals as listProposalsLib, type Proposal, type ProposalKey} from '@junobuild/cdn';
import {hasArgs} from '@junobuild/cli-tools';
import {type SatelliteParametersWithId} from '../../types/satellite';
import {formatDate} from '../../utils/format.utils';
import {assertConfigAndLoadSatelliteContext} from '../../utils/juno.config.utils';

export const listChanges = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext();

  const all = hasArgs({args, options: ['-a', '--all']});
  const every = hasArgs({args, options: ['-e', '--every']});

  const items = await listProposals({
    satellite,
    traverseAll: all
  });

  const changes = items
    .filter(([_, {status}]) => 'Open' in status || every)
    .reduce<Record<string, {hash: string; created_at: string}>>(
      (acc, [{proposal_id}, {sha256, created_at}]) => {
        const hash: Uint8Array | number[] | undefined = fromNullable(sha256);

        return {
          ...acc,
          [`ID ${proposal_id}`]: {
            hash: nonNullish(hash) ? uint8ArrayToHexString(hash) : '',
            created_at: formatDate(new Date(Number(created_at / 1_000_000n)))
          }
        };
      },
      {}
    );

  if (Object.keys(changes).length === 0) {
    console.log('There are no open changes right now.');
    return;
  }

  console.table(changes);
};

const listProposals = async ({
  startAfter,
  satellite,
  traverseAll
}: {
  startAfter?: bigint;
  satellite: SatelliteParametersWithId;
  traverseAll: boolean;
}): Promise<Array<[ProposalKey, Proposal]>> => {
  const {items, items_length, matches_length} = await listProposalsLib({
    cdn: {satellite},
    filter: {
      order: toNullable({
        desc: true
      }),
      paginate: nonNullish(startAfter)
        ? toNullable({
            start_after: toNullable(startAfter),
            limit: toNullable()
          })
        : toNullable()
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
