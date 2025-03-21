import {
  DEVELOPER_PROJECT_SATELLITE_PATH,
  RUST_TEMPLATE_SATELLITE_PATH
} from '../constants/dev.constants';
import {copyTemplateFile, readTemplateFile} from './fs.utils';

export const copySatelliteDid = async (overwrite?: boolean) => {
  await copyTemplateFile({
    template: 'satellite.did',
    sourceFolder: RUST_TEMPLATE_SATELLITE_PATH,
    destinationFolder: DEVELOPER_PROJECT_SATELLITE_PATH,
    overwrite
  });
};

export const readSatelliteDid = async (): Promise<string> => {
  return await readTemplateFile({template: 'satellite.did', sourceFolder: RUST_TEMPLATE_SATELLITE_PATH});
};
