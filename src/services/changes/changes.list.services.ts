import {fromNullable, nonNullish, toNullable, uint8ArrayToHexString} from '@dfinity/utils';
import {listProposals} from '@junobuild/cdn';
import {nextArg} from '@junobuild/cli-tools';
import {junoConfigExist, readJunoConfig} from '../../configs/juno.config';
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

  const all = nextArg({args, option: '-a'}) ?? nextArg({args, option: '--all'});

  const {items} = await listProposals({
    cdn: {satellite},
    filter: {
      order: toNullable({
        desc: true
      }),
      paginate: toNullable()
    }
  });

  const changes = items
    .filter(([_, {status}]) => 'Open' in status)
    .reduce((acc, [proposalId, {sha256, created_at}]) => {
      const hash = fromNullable(sha256);

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
