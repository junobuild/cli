import {
  DEVELOPER_PROJECT_SATELLITE_PATH,
  TEMPLATE_SATELLITE_PATH
} from '../constants/dev.constants';
import {copyTemplateFile, readTemplateFile} from './fs.utils';

export const copySatelliteDid = async (overwrite?: boolean) =>
  copyTemplateFile({
    template: 'satellite.did',
    sourceFolder: TEMPLATE_SATELLITE_PATH,
    destinationFolder: DEVELOPER_PROJECT_SATELLITE_PATH,
    overwrite
  });

export const readSatelliteDid = async (): Promise<string> =>
  readTemplateFile({template: 'satellite.did', sourceFolder: TEMPLATE_SATELLITE_PATH});
