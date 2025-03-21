import {cyan, green, magenta, yellow} from 'kleur';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {
  DEVELOPER_PROJECT_SATELLITE_PATH,
  RUST_TEMPLATE_PATH,
  TEMPLATE_SATELLITE_PATH
} from '../constants/dev.constants';
import {helpDevContinue} from '../help/dev.help';
import {copySatelliteDid} from '../utils/did.utils';
import {checkRustVersion} from '../utils/env.utils';
import {copyTemplateFile} from '../utils/fs.utils';

export const eject = async () => {
  const {valid} = await checkRustVersion();

  if (valid === 'error' || !valid) {
    return;
  }

  await copyTemplateFile({
    template: 'Cargo.toml',
    sourceFolder: RUST_TEMPLATE_PATH,
    destinationFolder: '.'
  });

  const devProjectSrcPath = join(DEVELOPER_PROJECT_SATELLITE_PATH, 'src');

  await mkdir(devProjectSrcPath, {recursive: true});

  await copyTemplateFile({
    template: 'Cargo.toml',
    sourceFolder: TEMPLATE_SATELLITE_PATH,
    destinationFolder: DEVELOPER_PROJECT_SATELLITE_PATH
  });

  await copyTemplateFile({
    template: 'lib.rs',
    sourceFolder: join(TEMPLATE_SATELLITE_PATH, 'src'),
    destinationFolder: devProjectSrcPath
  });

  await copySatelliteDid();

  console.log(success({src: DEVELOPER_PROJECT_SATELLITE_PATH}));
};

export const success = ({src}: {src: string}): string => `
✅ Satellite successfully ejected!

You can now extend your satellite's capabilities.
Edit the generated Rust template located in ${yellow(src)} and customize according to your needs.

Useful ${green('juno')} ${cyan('dev')} ${magenta('<subcommand>')} to continue with:

Subcommands:
  ${helpDevContinue}
`;
