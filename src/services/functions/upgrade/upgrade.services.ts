import {hasArgs, nextArg} from '@junobuild/cli-tools';
import {SATELLITE_OUTPUT} from '../../../constants/dev.constants';
import {SatelliteParametersWithId} from '../../../types/satellite';
import {assertConfigAndLoadSatelliteContext} from '../../../utils/satellite.utils';
import {upgradeSatelliteWithSrc} from '../../modules/upgrade/upgrade.satellite.services';
import {upgradeWithCdn} from './upgrade.cdn.services';

export const upgradeFunctions = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);

  const cdnOption = hasArgs({args, options: ['-c', '--cdn']});

  const fn = cdnOption ? upgradeWithCdn : upgradeWithSrc;

  await fn({
    args,
    satellite
  });
};

const upgradeWithSrc = async ({
  args,
  satellite
}: {
  args?: string[];
  satellite: SatelliteParametersWithId;
}) => {
  const srcArgs = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});
  const src = srcArgs ?? `${SATELLITE_OUTPUT}.gz`;

  await upgradeSatelliteWithSrc({
    args,
    src,
    satellite
  });
};
