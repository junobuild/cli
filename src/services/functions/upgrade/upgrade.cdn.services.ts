import {isEmptyString} from '@dfinity/utils';
import {assertAnswerCtrlC, nextArg} from '@junobuild/cli-tools';
import {Asset} from '@junobuild/core';
import prompts from 'prompts';
import {type SatelliteParametersWithId} from '../../../types/satellite';
import {defaultSatelliteDomain} from '../../../utils/domain.utils';
import {listCdnAssets} from './upgrade.cdn.list.services';

export const upgradeWithCdn = async ({
  args,
  satellite
}: {
  args?: string[];
  satellite: SatelliteParametersWithId;
}) => {
  const cdnPath = nextArg({args, option: '-c'}) ?? nextArg({args, option: '--cdn'});

  if (isEmptyString(cdnPath)) {
  }
};



const collectCdnAssets = (params: {satellite: SatelliteParametersWithId}): Promise<Asset[]> =>
  listCdnAssets(params);

const promptCdnFullPath = async ({
  satellite
}: {
  satellite: SatelliteParametersWithId;
}): Promise<string> => {
  const {fullPath}: {fullPath: string} = await prompts({
    type: 'select',
    name: 'fullPath',
    message: 'Which published WASM would you like to use?',
    choices: [
      ...domains.map(({domain}) => ({title: `https://${domain}`, value: `https://${domain}`})),
      {title: defaultSatelliteDomain(satelliteId), value: defaultSatelliteDomain(satelliteId)}
    ]
  });

  assertAnswerCtrlC(fullPath);

  return fullPath;
};
