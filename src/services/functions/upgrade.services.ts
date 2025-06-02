import {hasArgs, nextArg} from '@junobuild/cli-tools';
import {SATELLITE_OUTPUT} from '../../constants/dev.constants';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';
import {upgradeSatelliteWithSrc} from '../modules/upgrade/upgrade.satellite.services';

export const upgradeFunctions = async (args?: string[]) => {
  const immediate = hasArgs({args, options: ['-i', '--immediate']});
  const noCommit = hasArgs({args, options: ['-na', '--no-apply']});

  if (immediate) {
    await upgradeImmediate(args);
    
  }
};

const upgradeImmediate = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);

  const src = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});

  await upgradeSatelliteWithSrc({
    satellite,
    src: src ?? `${SATELLITE_OUTPUT}.gz`,
    args
  });
};
