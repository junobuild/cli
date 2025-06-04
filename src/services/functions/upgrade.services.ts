import {nextArg} from '@junobuild/cli-tools';
import {SATELLITE_OUTPUT} from '../../constants/dev.constants';
import {assertConfigAndLoadSatelliteContext} from '../../utils/satellite.utils';
import {upgradeSatelliteWithSrc} from '../modules/upgrade/upgrade.satellite.services';

export const upgradeFunctions = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);

  const srcArgs = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});
  const src = srcArgs ?? `${SATELLITE_OUTPUT}.gz`;

  await upgradeSatelliteWithSrc({
    args,
    src,
    satellite
  });
};
