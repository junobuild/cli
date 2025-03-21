import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {
  CARGO_TOML,
  DEVELOPER_PROJECT_SATELLITE_PATH,
  RUST_TEMPLATE_PATH,
  RUST_TEMPLATE_SATELLITE_PATH
} from '../../constants/dev.constants';
import {copySatelliteDid} from '../../utils/did.utils';
import {checkRustVersion} from '../../utils/env.utils';
import {copyTemplateFile} from '../../utils/fs.utils';

export const ejectRust = async () => {
  const {valid} = await checkRustVersion();

  if (valid === 'error' || !valid) {
    return;
  }

  await copyTemplateFile({
    template: CARGO_TOML,
    sourceFolder: RUST_TEMPLATE_PATH,
    destinationFolder: '.'
  });

  const devProjectSrcPath = join(DEVELOPER_PROJECT_SATELLITE_PATH, 'src');

  await mkdir(devProjectSrcPath, {recursive: true});

  await copyTemplateFile({
    template: CARGO_TOML,
    sourceFolder: RUST_TEMPLATE_SATELLITE_PATH,
    destinationFolder: DEVELOPER_PROJECT_SATELLITE_PATH
  });

  await copyTemplateFile({
    template: 'lib.rs',
    sourceFolder: join(RUST_TEMPLATE_SATELLITE_PATH, 'src'),
    destinationFolder: devProjectSrcPath
  });

  await copySatelliteDid();
};
