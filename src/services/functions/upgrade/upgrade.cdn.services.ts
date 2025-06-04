import {isNullish, notEmptyString} from '@dfinity/utils';
import {assertAnswerCtrlC, nextArg} from '@junobuild/cli-tools';
import {red} from 'kleur';
import prompts from 'prompts';
import {type SatelliteParametersWithId} from '../../../types/satellite';
import {listCdnAssets} from './upgrade.cdn.list.services';

export const upgradeWithCdn = async ({
  args,
  satellite
}: {
  args?: string[];
  satellite: SatelliteParametersWithId;
}) => {
  const cdnPath = nextArg({args, option: '-c'}) ?? nextArg({args, option: '--cdn'});

  const fullPath = cdnPath ?? (await selectCdnFullPath({satellite}));

  if (isNullish(fullPath)) {
    return;
  }


};

const selectCdnFullPath = async (params: {
  satellite: SatelliteParametersWithId;
}): Promise<AssetFullPath | undefined> => {
  const assets = await collectCdnAssets(params);

  if (assets.length === 0) {
    console.log(red('No published WASM files found in the CDN.'));
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
    title: `${fullPath}${notEmptyString(description) ? ` (${description})` : ''}`,
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
