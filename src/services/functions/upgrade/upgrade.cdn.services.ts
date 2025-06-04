import {isNullish, notEmptyString} from '@dfinity/utils';
import {assertAnswerCtrlC, hasArgs, nextArg} from '@junobuild/cli-tools';
import {yellow} from 'kleur';
import prompts from 'prompts';
import {CDN_RELEASES_FULL_PATH} from '../../../constants/functions.constants';
import {type SatelliteParametersWithId} from '../../../types/satellite';
import {defaultSatelliteDomain} from '../../../utils/domain.utils';
import {upgradeSatelliteWithCdn} from '../../modules/upgrade/upgrade.satellite.services';
import {listCdnAssets} from './upgrade.cdn.list.services';
import {logUpgradeResult} from '../../../utils/upgrade.utils';

export const upgradeWithCdn = async ({
  args,
  satellite
}: {
  args?: string[];
  satellite: SatelliteParametersWithId;
}) => {
  const cdnPath = hasArgs({args, options: ['--cdn-path']})
    ? nextArg({args, option: '--cdn-path'})
    : undefined;

  const fullPath = cdnPath ?? (await selectCdnFullPath({satellite}));

  if (isNullish(fullPath)) {
    return;
  }

  const result = await upgradeSatelliteWithCdn({
    args,
    cdn: {
      url: defaultSatelliteDomain(satellite.satelliteId),
      path: fullPath
    },
    satellite
  });

  logUpgradeResult({...result, successMessage: 'Satellite successfully upgraded with serverless functions.'});
};

const selectCdnFullPath = async (params: {
  satellite: SatelliteParametersWithId;
}): Promise<AssetFullPath | undefined> => {
  const assets = await collectCdnAssets(params);

  if (assets.length === 0) {
    console.log(yellow('No published WASM files found in the CDN.'));
    return undefined;
  }

  return await promptCdnFullPath({assets});
};

type AssetFullPath = string;

interface AssetForPrompt {
  title: string;
  value: AssetFullPath;
}

const collectCdnAssets = async (params: {
  satellite: SatelliteParametersWithId;
}): Promise<AssetForPrompt[]> => {
  const assets = await listCdnAssets(params);

  return assets.map(({fullPath, description}) => ({
    title: `${fullPath.replace(`${CDN_RELEASES_FULL_PATH}/`, '')}${notEmptyString(description) ? ` (${description})` : ''}`,
    value: fullPath
  }));
};

const promptCdnFullPath = async ({assets}: {assets: AssetForPrompt[]}): Promise<AssetFullPath> => {
  const {fullPath}: {fullPath: AssetFullPath} = await prompts({
    type: 'select',
    name: 'fullPath',
    message: 'Which published WASM would you like to use?',
    choices: assets
  });

  assertAnswerCtrlC(fullPath);

  return fullPath;
};
