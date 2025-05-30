import {fromNullable, nonNullish, toNullable, uint8ArrayToHexString} from '@dfinity/utils';
import {listProposals as listProposalsLib, Proposal, ProposalKey} from '@junobuild/cdn';
import {hasArgs} from '@junobuild/cli-tools';
import {junoConfigExist, readJunoConfig} from '../../configs/juno.config';
import {SatelliteParametersWithId} from '../../types/satellite';
import {configEnv} from '../../utils/config.utils';
import {formatTime} from '../../utils/format.utils';
import {consoleNoConfigFound} from '../../utils/msg.utils';
import {satelliteParameters} from '../../utils/satellite.utils';

export const listChanges = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    consoleNoConfigFound();
    return;
  }

  const env = configEnv(args);
  const {satellite: satelliteConfig} = await readJunoConfig(env);

  const satellite = await satelliteParameters({satellite: satelliteConfig, env});

  const all = hasArgs({args, options: ['-a', '--all']});

  const items = await listProposals({
    satellite,
    traverseAll: all
  });

  const changes = items
    .filter(([_, {status}]) => 'Open' in status)
    .reduce((acc, [proposalId, {sha256, created_at}]) => {
      const hash: Uint8Array | number[] | undefined = fromNullable(sha256);

      return {
        ...acc,
        [`${proposalId}`]: {
          hash: nonNullish(hash) ? uint8ArrayToHexString(hash) : '',
          created_at: formatTime(new Date(Number(created_at / 1_000_000n)))
        }
      };
    }, {});

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
}): Promise<[ProposalKey, Proposal][]> => {
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
