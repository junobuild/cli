import {hasArgs, nextArg} from '@junobuild/cli-tools';
import {SATELLITE_OUTPUT} from '../../../constants/dev.constants';
import {type UpgradeFunctionsParams} from '../../../types/functions';
import {assertConfigAndLoadSatelliteContext} from '../../../utils/satellite.utils';
import {upgradeSatelliteWithSrc} from '../../modules/upgrade/upgrade.satellite.services';
import {upgradeFunctionsWithProposal} from './upgrade.with-proposal.services';

export const upgradeFunctions = async (args?: string[]) => {
  const {satellite} = await assertConfigAndLoadSatelliteContext(args);

  const srcArgs = nextArg({args, option: '-s'}) ?? nextArg({args, option: '--src'});
  const src = srcArgs ?? `${SATELLITE_OUTPUT}.gz`;

  const immediate = hasArgs({args, options: ['-i', '--immediate']});

  if (immediate) {
    await upgradeImmediate({
      args,
      src,
      satellite
    });
    return;
  }

  await upgradeFunctionsWithProposal({
    args,
    src,
    satellite
  });
};

const upgradeImmediate = async (params: UpgradeFunctionsParams) => {
  await upgradeSatelliteWithSrc(params);
};
