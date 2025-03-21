import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {
  DEVELOPER_PROJECT_SATELLITE_PATH,
  INDEX_MJS,
  INDEX_TS,
  MJS_TEMPLATE_PATH,
  TS_TEMPLATE_PATH
} from '../../constants/dev.constants';
import {copyTemplateFile} from '../../utils/fs.utils';

export const ejectTypeScript = async () => {
  await eject({lang: 'ts'});
};

export const ejectJavaScript = async () => {
  await eject({lang: 'mjs'});
};

const eject = async ({lang}: {lang: 'ts' | 'mjs'}) => {
  const devProjectSrcPath = join(DEVELOPER_PROJECT_SATELLITE_PATH);

  await mkdir(devProjectSrcPath, {recursive: true});

  await copyTemplateFile({
    template: lang === 'mjs' ? INDEX_MJS : INDEX_TS,
    sourceFolder: lang === 'mjs' ? MJS_TEMPLATE_PATH : TS_TEMPLATE_PATH,
    destinationFolder: DEVELOPER_PROJECT_SATELLITE_PATH
  });
};
