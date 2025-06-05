import {isNullish, nonNullish, notEmptyString} from '@dfinity/utils';
import {assertAnswerCtrlC, hasArgs, nextArg} from '@junobuild/cli-tools';
import {yellow} from 'kleur';
import prompts from 'prompts';
import {CDN_RELEASES_FULL_PATH} from '../../../constants/functions.constants';
import {type SatelliteParametersWithId} from '../../../types/satellite';
import {defaultSatelliteDomain} from '../../../utils/domain.utils';
import {logUpgradeResult} from '../../../utils/upgrade.utils';
import {upgradeSatelliteWithCdn} from '../../modules/upgrade/upgrade.satellite.services';
import {listCdnAssets} from './upgrade.cdn.list.services';
import {ENV} from '../../../env';

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

  const customHost = URL.parse(defaultSatelliteDomain(satellite.satelliteId))?.hostname;

  const cdn = {
    url: ENV.containerUrl ?? defaultSatelliteDomain(satellite.satelliteId),
    path: fullPath,
    ...(nonNullish(customHost) && {customHost})
  };

  const result = await upgradeSatelliteWithCdn({
    args,
    cdn,
    satellite
  });

  logUpgradeResult({
    ...result,
    successMessage: 'Satellite successfully upgraded with serverless functions.'
  });
};

const selectCdnFullPath = async (params: {
  satellite: SatelliteParametersWithId;
}): Promise<AssetFullPathToken | undefined> => {
  const assets = await collectCdnAssets(params);

  if (assets.length === 0) {
    console.log(yellow('No published WASM files found in the CDN.'));
    return undefined;
  }

  return await promptCdnFullPath({assets});
};

type AssetFullPathToken = string;

interface AssetForPrompt {
  title: string;
  value: AssetFullPathToken;
}

const collectCdnAssets = async (params: {
  satellite: SatelliteParametersWithId;
}): Promise<AssetForPrompt[]> => {
  const assets = await listCdnAssets(params);

  return assets.map(({fullPath, description, token}) => ({
    title: `${fullPath.replace(`${CDN_RELEASES_FULL_PATH}/`, '')}${notEmptyString(description) ? ` (${description})` : ''}`,
    value: `${fullPath}${notEmptyString(token) ? `?token=${token}` : ''}`
  }));
};

const promptCdnFullPath = async ({
  assets
}: {
  assets: AssetForPrompt[];
}): Promise<AssetFullPathToken> => {
  const {fullPath}: {fullPath: AssetFullPathToken} = await prompts({
    type: 'select',
    name: 'fullPath',
    message: 'Which published WASM would you like to use?',
    choices: assets
  });

  assertAnswerCtrlC(fullPath);

  return fullPath;
};
